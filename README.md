# education

## `edu` CLI

Zero-dependency CLI (Node.js) at the repo root for scaffolding semesters and courses.

```
./edu init <SEMESTER>                     # create a semester folder
./edu course create                       # interactive: pick a semester, then name the course
./edu course <SEMESTER> "<Course Name>"   # create a course with LECTURES/ and NOTES/
./edu list semesters                      # list all semesters
./edu list courses <SEMESTER>             # list courses in a semester
./edu open <SEMESTER> [Course Name]       # open folder in Finder
./edu help
```

### Interactive course creation

Run `./edu course create` (or just `./edu course`) and the CLI lists your existing
semesters as numbered options — pick one, or choose **"+ Create new semester"**, then
enter the course name. It scaffolds `LECTURES/`, `NOTES/`, and `AGENTS.md` for you.

```
$ ./edu course create
Select a semester:
  1) FALL-2026
  2) + Create new semester

Enter number: 1
Course name in "FALL-2026": Operating System Theory
✔ created Course "Operating System Theory"
```

Created structure:

```
SEMESTER/               e.g. FALL-2026/
└── Course Name/        e.g. Operation System Theory/
    ├── LECTURES/       lecture PDFs (1.pdf, 2.pdf, ...)
    ├── NOTES/          Markdown notes per lecture
    └── AGENTS.md
```

Examples:

```sh
./edu init FALL-2026
./edu course FALL-2026 "Operation System Theory"
```

The CLI is idempotent — re-running a command never overwrites existing files (e.g. your `AGENTS.md` or lecture PDFs are left untouched).

Optionally make `edu` available everywhere: `npm link` (uses the `bin` entry in `package.json`), then run `edu ...` from anywhere inside this repo.