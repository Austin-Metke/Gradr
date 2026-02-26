from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import zipfile
import tempfile
import shutil
from pathlib import Path
from typing import Optional
import base64
import json

# Support both running as a package (from project root) and directly (from backend dir)
try:
    from .db.database import (
        create_assignment,
        get_assignments,
        create_submission,
        update_submission_content,
        get_submissions_by_assignment,
        get_submission,
        set_submission_grade,
        set_final_grade,
        export_grades,
        get_assignment,
    )
    from .services.file_parser import (
        group_files_by_student,
        parse_python_file,
        extract_screenshot_text,
    )
    from .services.llm_provider import LLMProvider
    from .services.grader import GradingService
    from .config import get_config, set_provider
except ImportError:
    from db.database import (
        create_assignment,
        get_assignments,
        create_submission,
        update_submission_content,
        get_submissions_by_assignment,
        get_submission,
        set_submission_grade,
        set_final_grade,
        export_grades,
        get_assignment,
    )
    from services.file_parser import (
        group_files_by_student,
        parse_python_file,
        extract_screenshot_text,
    )
    from services.llm_provider import LLMProvider
    from services.grader import GradingService
    from config import get_config, set_provider

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----- Configuration endpoints -----
@app.get("/api/providers")
async def providers():
    # static list of supported LLM providers
    return {
        "providers": [
            {"id": "ollama", "name": "Ollama (local)", "requires_key": False},
            {"id": "openai", "name": "OpenAI", "requires_key": True},
            {"id": "anthropic", "name": "Anthropic", "requires_key": True},
            {"id": "openrouter", "name": "OpenRouter", "requires_key": True},
        ]
    }

@app.post("/api/config/provider")
async def set_provider_endpoint(provider: str = Form(...), model: Optional[str] = Form(None)):
    set_provider(provider, model)
    return {"status": "ok"}

@app.get("/api/config/provider")
async def get_provider_config():
    return get_config()

# ----- Assignment management -----
@app.post("/api/assignments")
async def create_assignment_endpoint(
    name: str = Form(...),
    rubric_file: UploadFile = File(...),
    syllabus_file: Optional[UploadFile] = File(None),
):
    async def _extract_text(upload: UploadFile) -> str:
        data = await upload.read()
        fn = upload.filename.lower()
        if fn.endswith('.pdf'):
            # parse PDF to plain text
            try:
                from PyPDF2 import PdfReader
                import io
                reader = PdfReader(io.BytesIO(data))
                pages = [p.extract_text() or '' for p in reader.pages]
                return '\n'.join(pages)
            except Exception:
                # fallback to returning binary as latin1
                return data.decode('latin1', errors='ignore')
        else:
            try:
                return data.decode('utf-8')
            except Exception:
                return data.decode('latin1', errors='ignore')

    rubric_text = await _extract_text(rubric_file)
    syllabus_text = None
    if syllabus_file:
        syllabus_text = await _extract_text(syllabus_file)
    assignment_id = create_assignment(name, rubric_text,
                                      syllabus_text if syllabus_text else None)
    return {"assignment_id": assignment_id}

@app.get("/api/assignments")
async def list_assignments():
    return get_assignments()

@app.get("/api/assignments/{assignment_id}")
async def get_assignment_endpoint(assignment_id: int):
    assign = get_assignment(assignment_id)
    if not assign:
        raise HTTPException(status_code=404, detail="Assignment not found")
    # return full details including rubric text/syllabus
    return assign

# ----- Submission import (existing code) -----
@app.post("/api/assignments/{assignment_id}/import-folder")
async def import_submission_folder(
    assignment_id: int,
    archive: UploadFile = File(...)
):
    """
    Import entire Canvas download folder (as zip).
    Automatically groups files by student and creates submissions.
    """
    # Create temp directory for extraction
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        
        # Save and extract zip
        zip_path = tmp_path / "submissions.zip"
        with open(zip_path, "wb") as f:
            content = await archive.read()
            f.write(content)
        
        extract_dir = tmp_path / "extracted"
        with zipfile.ZipFile(zip_path, 'r') as zf:
            zf.extractall(extract_dir)
        
        # Gather all submission files
        all_files = []
        for ext in ["*.py", "*.png", "*.jpg", "*.jpeg", "*.PNG", "*.JPG"]:
            all_files.extend(extract_dir.rglob(ext))
        
        # Group by student
        grouped = group_files_by_student([str(f) for f in all_files])
        
        results = []
        for student_name, data in grouped.items():
            # Create submission record
            sub_id = create_submission(
                assignment_id=assignment_id,
                student_name=student_name,
                canvas_id=data["canvas_id"]
            )
            
            # Process each file
            code_content = []
            screenshots = []
            
            for file_info in data["files"]:
                file_path = Path(file_info["path"])
                
                if file_info["type"] == "code":
                    with open(file_path) as f:
                        parsed = parse_python_file(f.read())
                        code_content.append({
                            "filename": file_info["original_name"],
                            **parsed
                        })
                else:
                    with open(file_path, "rb") as f:
                        ocr_text = await extract_screenshot_text(f.read())
                        # Also store the image bytes for display
                        f.seek(0)
                        img_b64 = base64.b64encode(f.read()).decode()
                        screenshots.append({
                            "filename": file_info["original_name"],
                            "ocr_text": ocr_text,
                            "image_data": img_b64
                        })
            
            # Update submission with all content
            update_submission_content(sub_id, code_content, screenshots)
            
            results.append({
                "student": student_name,
                "canvas_id": data["canvas_id"],
                "submission_id": sub_id,
                "files_count": len(data["files"]),
                "code_files": len(code_content),
                "screenshots": len(screenshots)
            })
        
        return {
            "imported": len(results),
            "students": results
        }

# ----- Submission retrieval -----
@app.get("/api/assignments/{assignment_id}/submissions")
async def submissions_for_assignment(assignment_id: int):
    return get_submissions_by_assignment(assignment_id)

@app.get("/api/submissions/{submission_id}")
async def submission_detail(submission_id: int):
    sub = get_submission(submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    return sub

# ----- Grading endpoints -----
@app.post("/api/assignments/{assignment_id}/grade/{submission_id}")
async def grade_single(assignment_id: int, submission_id: int):
    # fetch submission and rubric
    sub = get_submission(submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    assign = get_assignment(assignment_id)
    if not assign:
        raise HTTPException(status_code=404, detail="Assignment not found")
    rubric = assign.get("rubric_text", "")
    grader = GradingService(LLMProvider())
    result = await grader.grade_submission(sub, rubric)
    set_submission_grade(submission_id, result)
    return result

@app.post("/api/assignments/{assignment_id}/grade-all")
async def grade_all(assignment_id: int):
    subs = get_submissions_by_assignment(assignment_id)
    assign = get_assignment(assignment_id)
    rubric = assign.get("rubric_text", "") if assign else ""
    grader = GradingService(LLMProvider())
    count = 0
    for sdata in subs:
        if sdata.get("grade") is None:
            res = await grader.grade_submission(sdata, rubric)
            set_submission_grade(sdata["id"], res)
            count += 1
    return {"graded": count}

@app.put("/api/submissions/{submission_id}/grade")
async def set_grade(submission_id: int, grade: dict):
    # grade is {grade: number}
    if "grade" not in grade:
        raise HTTPException(status_code=400, detail="Missing grade field")
    set_final_grade(submission_id, grade["grade"])
    return {"status": "ok"}

# ----- Export -----
@app.get("/api/assignments/{assignment_id}/export")
async def export_csv(assignment_id: int):
    csv_text = export_grades(assignment_id)
    return StreamingResponse(
        iter([csv_text.encode()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=grades_{assignment_id}.csv"}
    )