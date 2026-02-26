# backend/services/file_parser.py
import re
from pathlib import Path
from typing import Optional, Tuple
import pytesseract
from PIL import Image
import io

def parse_canvas_filename(filename: str) -> Tuple[str, Optional[str], str]:
    """
    Parse Canvas download filename format.
    Format: lastname_firstname(s)_canvasid_assignmentinfo_originalfilename.ext
    
    Examples:
        'smith_john_12345_lab1_main.py' -> ('John Smith', '12345', 'main.py')
        'garcia_maria_elena_67890_lab1_solution.py' -> ('Maria Elena Garcia', '67890', 'solution.py')
        'o_brien_sean_patrick_11111_hw2_code.py' -> ('Sean Patrick O Brien', '11111', 'code.py')
    
    Returns: (full_name, canvas_id, original_filename)
    """
    # Strip extension for parsing, keep for return
    stem = Path(filename).stem
    ext = Path(filename).suffix
    
    parts = stem.split('_')
    
    # Find the Canvas ID (first purely numeric segment of 4+ digits)
    canvas_id_idx = None
    canvas_id = None
    for i, part in enumerate(parts):
        if part.isdigit() and len(part) >= 4:
            canvas_id_idx = i
            canvas_id = part
            break
    
    if canvas_id_idx is None or canvas_id_idx < 2:
        # Fallback: can't parse, use filename as name
        return (stem.replace('_', ' ').title(), None, filename)
    
    # Everything before canvas_id is the name
    # First part is lastname, rest before ID is firstname(s)
    lastname = parts[0]
    firstnames = parts[1:canvas_id_idx]
    
    # Reconstruct: "Maria Elena Garcia"
    full_name = ' '.join(firstnames + [lastname]).title()
    
    # Everything after canvas_id is assignment info + original filename
    remaining = parts[canvas_id_idx + 1:]
    # Last part is usually the original filename
    original_filename = remaining[-1] + ext if remaining else filename
    
    return (full_name, canvas_id, original_filename)


def parse_python_file(content: str) -> dict:
    """Extract code and any docstrings/comments for context"""
    return {
        "raw_code": content,
        "line_count": len(content.splitlines()),
        "has_main": "if __name__" in content,
        "imports": extract_imports(content),
        "functions": extract_function_names(content),
    }


def extract_imports(code: str) -> list:
    """Pull out import statements"""
    import_pattern = r'^(?:from\s+[\w.]+\s+)?import\s+.+$'
    return re.findall(import_pattern, code, re.MULTILINE)


def extract_function_names(code: str) -> list:
    """Get defined function names"""
    func_pattern = r'^def\s+(\w+)\s*\('
    return re.findall(func_pattern, code, re.MULTILINE)


async def extract_screenshot_text(image_bytes: bytes) -> str:
    """OCR screenshot to extract visible text/output"""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        text = pytesseract.image_to_string(img)
        return text.strip() if text.strip() else "[No text detected in screenshot]"
    except Exception as e:
        return f"[OCR failed: {str(e)}]"


def group_files_by_student(file_list: list) -> dict:
    """
    Group uploaded files by student based on Canvas naming.
    Returns: {student_name: {canvas_id: str, files: [...]}}
    """
    students = {}
    
    for filepath in file_list:
        filename = Path(filepath).name
        full_name, canvas_id, original_name = parse_canvas_filename(filename)
        
        if full_name not in students:
            students[full_name] = {
                "canvas_id": canvas_id,
                "files": []
            }
        
        students[full_name]["files"].append({
            "path": filepath,
            "original_name": original_name,
            "type": "code" if filepath.endswith(".py") else "screenshot"
        })
    
    return students