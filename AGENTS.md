# Repo Conventions

This repo organizes study material as `Semester/Course` folders.

- Semesters are named like `FALL-2026`, `SPRING-2027` (uppercase season, hyphen, year).
- Each course folder contains:
  - `LECTURES/` — lecture PDFs named by number (`1.pdf`, `2.pdf`, ...).
  - `NOTES/` — one Markdown note per lecture summarizing its content.
  - `AGENTS.md` — course-specific agent notes.
- Use the root CLI to scaffold folders instead of creating them manually:
  - `./edu init <SEMESTER>`
  - `./edu course create` (interactive: pick a semester from a numbered list, then name the course)
  - `./edu course <SEMESTER> "<Course Name>"`
  - `./edu list semesters` / `./edu list courses <SEMESTER>`
  - See `README.md` for full usage.
