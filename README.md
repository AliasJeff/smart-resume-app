# smart-resume-app

Full-stack course assignment: Next.js (App Router) + Tailwind CSS frontend; FastAPI + SQLite backend.

## Project standards

See [`.cursor/rules/project-global-standards.mdc`](.cursor/rules/project-global-standards.mdc) for Cursor agent rules. Summary:

- Keep code minimal and readable; avoid over-abstraction.
- SQLite single-table storage; link by resume ID only — no user login/auth.
- All LLM calls must use try-except and return structured mock data when the API key is missing or the call fails, so the frontend always renders.
