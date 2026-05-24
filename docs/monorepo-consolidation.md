# Monorepo consolidation

All product code for Nibras lives in this repository. You do **not** need separate clones of the old wrapper or side repos for day-to-day work.

| Former repo | Status in `nibras` |
|-------------|-------------------|
| **nibras** (was `nibras-cli`) | This repo — API, web, CLI, worker, proxy |
| **ChatBot.V1** | `apps/tutor` — Flask AI tutor |
| **nibras-student-dashboard** | **Legacy** — static HTML UI; features are in `apps/web`. Keep the old repo only for reference or one-off migration. |
| **Nibras-new-ui** | **Optional wrapper** — only pinned submodules; not required if you work here directly |

## AI tutor

- Service: `apps/tutor`
- API env: `CHATBOT_V1_URL=http://127.0.0.1:5000`
- Run: `npm run tutor:dev` (needs Python 3.11+ and `pip install -r apps/tutor/requirements.txt`)
