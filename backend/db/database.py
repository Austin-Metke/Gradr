from __future__ import annotations
import json
from typing import Optional, List, Dict, Any
from pathlib import Path

from sqlmodel import SQLModel, Field, create_engine, Session, select

# default database file next to this module
DB_PATH = Path(__file__).parent / "gradeflow.db"
ENGINE = create_engine(f"sqlite:///{DB_PATH}", echo=False, connect_args={"check_same_thread": False})


class Assignment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    rubric_text: str
    syllabus_text: Optional[str] = None


class Submission(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    assignment_id: int = Field(foreign_key="assignment.id")
    student_name: str
    canvas_id: Optional[str] = None
    code_files: Optional[str] = Field(default="[]")  # store JSON list
    screenshots: Optional[str] = Field(default="[]")
    grade: Optional[str] = None  # JSON blob with grading result
    final_grade: Optional[int] = None


# create tables if not exist
SQLModel.metadata.create_all(ENGINE)


def _to_json(v: Optional[str]) -> Any:
    if v is None:
        return None
    try:
        return json.loads(v)
    except Exception:
        return v


def _from_json(v: Any) -> str:
    return json.dumps(v)


def create_assignment(name: str, rubric_text: str, syllabus_text: Optional[str] = None) -> int:
    with Session(ENGINE) as session:
        a = Assignment(name=name, rubric_text=rubric_text, syllabus_text=syllabus_text)
        session.add(a)
        session.commit()
        session.refresh(a)
        return a.id


def get_assignments() -> List[Dict[str, Any]]:
    with Session(ENGINE) as session:
        assigns = session.exec(select(Assignment)).all()
        return [{"id": a.id, "name": a.name} for a in assigns]


def create_submission(assignment_id: int, student_name: str, canvas_id: Optional[str]) -> int:
    with Session(ENGINE) as session:
        s = Submission(assignment_id=assignment_id, student_name=student_name, canvas_id=canvas_id)
        session.add(s)
        session.commit()
        session.refresh(s)
        return s.id


def update_submission_content(sub_id: int, code_content: List[Dict], screenshots: List[Dict]) -> None:
    with Session(ENGINE) as session:
        sub = session.get(Submission, sub_id)
        if not sub:
            return
        sub.code_files = _from_json(code_content)
        sub.screenshots = _from_json(screenshots)
        session.add(sub)
        session.commit()


def get_submissions_by_assignment(assignment_id: int) -> List[Dict[str, Any]]:
    with Session(ENGINE) as session:
        subs = session.exec(select(Submission).where(Submission.assignment_id == assignment_id)).all()
        results = []
        for s in subs:
            results.append({
                "id": s.id,
                "student_name": s.student_name,
                "canvas_id": s.canvas_id,
                "code_files": _to_json(s.code_files) or [],
                "screenshots": _to_json(s.screenshots) or [],
                "grade": _to_json(s.grade),
                "final_grade": s.final_grade,
            })
        return results


def get_submission(submission_id: int) -> Optional[Dict[str, Any]]:
    with Session(ENGINE) as session:
        s = session.get(Submission, submission_id)
        if not s:
            return None
        return {
            "id": s.id,
            "student_name": s.student_name,
            "canvas_id": s.canvas_id,
            "code_files": _to_json(s.code_files) or [],
            "screenshots": _to_json(s.screenshots) or [],
            "grade": _to_json(s.grade),
            "final_grade": s.final_grade,
        }


def set_submission_grade(submission_id: int, grade_result: Dict) -> None:
    with Session(ENGINE) as session:
        s = session.get(Submission, submission_id)
        if not s:
            return
        s.grade = _from_json(grade_result)
        session.add(s)
        session.commit()


def set_final_grade(submission_id: int, grade: int) -> None:
    with Session(ENGINE) as session:
        s = session.get(Submission, submission_id)
        if not s:
            return
        s.final_grade = grade
        session.add(s)
        session.commit()


def export_grades(assignment_id: int) -> str:
    """Return CSV text for all submissions under an assignment."""
    import csv
    from io import StringIO

    subs = get_submissions_by_assignment(assignment_id)
    sio = StringIO()
    writer = csv.writer(sio)
    writer.writerow(["Student Name", "Canvas ID", "Final Grade"])
    for s in subs:
        writer.writerow([s.get("student_name"), s.get("canvas_id"), s.get("final_grade")])
    return sio.getvalue()


def get_assignment(assignment_id: int) -> Optional[Dict[str, Any]]:
    with Session(ENGINE) as session:
        a = session.get(Assignment, assignment_id)
        if not a:
            return None
        return {"id": a.id, "name": a.name, "rubric_text": a.rubric_text, "syllabus_text": a.syllabus_text}
