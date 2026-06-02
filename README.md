# smart-resume-app

Full-stack course assignment: Next.js (App Router) + Tailwind CSS frontend; FastAPI + SQLite backend.

## Backend quick start

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

Server runs at `http://localhost:8000`. API reference: [`backend/API.md`](backend/API.md).

Copy `backend/.env.example` to `backend/.env` and set `OPENAI_API_KEY` for live LLM calls. Without a valid key, parse/optimize endpoints return structured mock data so the frontend can still render.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/upload` | Upload PDF, extract text, save to DB |
| POST | `/api/parse/{id}` | Parse `raw_text` to structured JSON (`parsed_data`) |
| POST | `/api/optimize/{id}` | STAR-optimize experience in `parsed_data` (`optimized_data`) |
| GET | `/api/resume/{id}` | Get resume by UUID |

## Project standards

See [`.cursor/rules/project-global-standards.mdc`](.cursor/rules/project-global-standards.mdc) for Cursor agent rules. Summary:

- Keep code minimal and readable; avoid over-abstraction.
- SQLite single-table storage; link by resume ID only — no user login/auth.
- All LLM calls must use try-except and return structured mock data when the API key is missing or the call fails, so the frontend always renders.
