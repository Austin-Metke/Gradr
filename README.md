# GradeFlow

GradeFlow is a full-stack tool for importing, grading and exporting student code submissions. It uses a Python/FastAPI backend with SQLite (via SQLModel) and a React/TypeScript frontend. LLM providers (Ollama, OpenAI, Anthropic, etc.) can be configured to power AI-based grading recommendations.

## Setup

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# optional: install additional providers (e.g. ``openai``) if not already installed
```

### Frontend

```bash
cd frontend
npm install
# or `yarn`/`pnpm` if you prefer
```

## Running

Start the backend API server:

```bash
cd backend
# (activate virtualenv if you created one)
uvicorn backend.main:app --reload --port 8000
```

Start the frontend locally (Vite is already configured):

```bash
cd frontend
npm install         # already done earlier
npm run dev         # starts on localhost:3000 or next available port
```

The development server will proxy requests to `http://localhost:8000` by default (via CORS).
You can build a production bundle with `npm run build` and serve it from any static server.

## Features

- Select LLM provider and model (Ollama, OpenAI, Anthropic, OpenRouter)
- Configure API keys as needed
- Create assignments by uploading rubric (and optional syllabus)
- Import Canvas zip folder; submissions automatically grouped by student
- View students, code files, screenshots with OCR
- AI grading recommendations using LLM or fallback stub
- Manual final grade adjustment and feedback
- Export grades to CSV for Canvas

## Environment variables

If you configure an LLM provider that requires an API key (OpenAI or Anthropic), set the corresponding environment variable before starting the backend:

```bash
export OPENAI_API_KEY=sk-...   # for OpenAI
export ANTHROPIC_API_KEY=...   # for Anthropic
```

The provider configuration is stored in `backend/config.json` and can be changed via the frontend or API.

## Development Notes

- The backend uses `backend/db/gradeflow.db` SQLite file; schema created automatically.
- Configuration persists to `backend/config.json`.
- LLM provider stub randomly generates grades if no provider configured or if provider call fails.

## Testing

Use `curl` to exercise the API endpoints (see comments in `backend/main.py`).

## Extending

- Add authentication, persistent user accounts
- Hook up real LLM provider credentials and results parsing
- Integrate with Canvas API for automated download/upload
- Improve frontend UI with a bundler, routing, and styles

