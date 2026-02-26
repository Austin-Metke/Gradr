# backend/services/grader.py (updated)
from enum import IntEnum
import json
from typing import Any, Optional


class GradeTier(IntEnum):
    ZERO = 0
    HALF = 50
    FULL = 100


class GradingService:
    def __init__(self, llm: Any):
        self.llm = llm

    async def grade_submission(
        self,
        submission: dict,
        rubric: str,
        syllabus_context: Optional[str] = None
    ) -> dict:
        system_prompt = self._build_system_prompt(rubric, syllabus_context)
        user_prompt = self._build_submission_prompt(submission)

        response = await self.llm.complete(user_prompt, system_prompt)
        return self._parse_grade_response(response)

    def _build_system_prompt(self, rubric: str, syllabus: Optional[str]) -> str:
        return f"""You are a TA grading student code submissions for CST 205.

RUBRIC/REQUIREMENTS:
{rubric}

{f'COURSE CONTEXT:{chr(10)}{syllabus}' if syllabus else ''}

GRADING SCALE (Professor's Policy):
- 100: Meets all requirements, code runs correctly, demonstrates understanding
- 50: Partial completion, significant issues but shows effort/partial understanding
- 0: Not submitted, completely non-functional, or shows no understanding

YOUR TASK:
1. Analyze the submitted code against requirements
2. Check if screenshots demonstrate working output (if provided)
3. Recommend a grade tier (0, 50, or 100)
4. Provide specific feedback for the student

RESPOND IN THIS EXACT JSON FORMAT:
{{
    "recommended_grade": <0 or 50 or 100>,
    "confidence": <"high" or "medium" or "low">,
    "meets_requirements": [
        {{"requirement": "description", "met": true/false, "notes": "specifics"}}
    ],
    "code_quality": {{
        "runs": true/false,
        "logic_correct": true/false,
        "style_acceptable": true/false,
        "issues": ["issue1", "issue2"]
    }},
    "feedback": "Constructive feedback paragraph for student",
    "ta_notes": "Private notes for TA about edge cases or concerns"
}}"""

    def _build_submission_prompt(self, submission: dict) -> str:
        prompt = f"STUDENT: {submission['student_name']}\n"
        if submission.get("canvas_id"):
            prompt += f"CANVAS ID: {submission['canvas_id']}\n"
        prompt += "\n"

        if submission.get("code_files"):
            for code_file in submission.get("code_files", []):
                prompt += f"--- FILE: {code_file['filename']} ---\n"
                prompt += f"```python\n{code_file['raw_code']}\n```\n\n"

        if submission.get("screenshots"):
            prompt += "SCREENSHOT OUTPUT:\n"
            for i, ss in enumerate(submission.get("screenshots", []), 1):
                prompt += f"Screenshot {i} ({ss['filename']}):\n"
                prompt += f"  Detected text/output: {ss['ocr_text']}\n\n"

        return prompt

    def _parse_grade_response(self, response: str) -> dict:
        clean = response.strip()
        if clean.startswith("```"):
            lines = clean.split('\n')
            clean = '\n'.join(lines[1:-1] if lines[-1] == '```' else lines[1:])
            if clean.startswith("json"):
                clean = clean[4:].strip()

        try:
            parsed = json.loads(clean)
            # Validate grade is in allowed values
            if parsed.get("recommended_grade") not in [0, 50, 100]:
                # Round to nearest tier
                raw = parsed.get("recommended_grade", 50)
                if raw < 25:
                    parsed["recommended_grade"] = 0
                elif raw < 75:
                    parsed["recommended_grade"] = 50
                else:
                    parsed["recommended_grade"] = 100
            return parsed
        except json.JSONDecodeError:
            # Fallback parsing if LLM didn't format properly
            return {
                "recommended_grade": 50,
                "confidence": "low",
                "feedback": response,
                "ta_notes": "Auto-grading returned non-JSON response, manual review needed"
            }