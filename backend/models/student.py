# This module can be used to define student-related ORM models.
# Current implementation keeps models in db/database.py; re-export if needed.

from ..db.database import Submission

__all__ = ["Submission"]