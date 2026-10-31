#!/usr/bin/env node
import { mkdirSync, existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';

const HERE = dirname(fileURLToPath(import.meta.url));
// edu.mjs lives at the repo root; keep working if it is moved into src/.
const ROOT = existsSync(join(HERE, 'package.json')) ? HERE : resolve(HERE, '..');

const AGENTS_COURSE_TEMPLATE = `# Course Agent Notes

## LECTURES/
- Contains lecture PDFs, named by lecture number (e.g. \`1.pdf\`, \`2.pdf\`).
- When a new lecture PDF is added, create a matching Markdown note in \`NOTES/\`
  named \`<number>. <Title>.md\` and summarize the lecture content there.

## NOTES/
- One Markdown note per lecture; use clear headings, key definitions, and examples.
`;

function fail(msg) {
  console.error(`error: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`✔ ${msg}`);
}

function ensureDir(path, label) {
  if (existsSync(path)) {
    console.log(`• ${label} already exists`);
    return false;
  }
  mkdirSync(path, { recursive: true });
  ok(`created ${label}`);
  return true;
}

function semesterDir(name) {
  return join(ROOT, name);
}

function courseDir(semester, course) {
  return join(semesterDir(semester), course);
}

function writeIfMissing(file, content) {
  if (existsSync(file)) {
    console.log(`• ${file.replace(ROOT + '/', '')} already exists — left untouched`);
    return;
  }
  writeFileSync(file, content, 'utf8');
  ok(`wrote ${file.replace(ROOT + '/', '')}`);
}

function listSemesters() {
  return readdirSync(ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.') && d.name !== 'bin' && d.name !== 'src')
    .map((d) => d.name);
}

// Build a course folder from a resolved semester + course name.
function scaffoldCourse(semester, course) {
  const dir = courseDir(semester, course);
  ensureDir(dir, `Course "${course}"`);
  ensureDir(join(dir, 'LECTURES'), 'LECTURES/');
  ensureDir(join(dir, 'NOTES'), 'NOTES/');
  writeIfMissing(join(dir, 'AGENTS.md'), AGENTS_COURSE_TEMPLATE);
  writeIfMissing(join(dir, 'LECTURES', '.gitkeep'), '');
  writeIfMissing(join(dir, 'NOTES', '.gitkeep'), '');
}

// Interactive flow: pick a semester from a numbered list, then enter the course name.
async function createCourseInteractive() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const semesters = listSemesters();
    if (semesters.length === 0) {
      console.log('No semesters found yet.');
      const name = (await rl.question('New semester name (e.g. FALL-2026): ')).trim();
      if (!name) fail('semester name is required');
      ensureDir(semesterDir(name), `Semester "${name}"`);
      const course = (await rl.question('Course name: ')).trim();
      if (!course) fail('course name is required');
      scaffoldCourse(name, course);
      return;
    }

    console.log('Select a semester:');
    semesters.forEach((s, i) => console.log(`  ${i + 1}) ${s}`));
    console.log(`  ${semesters.length + 1}) + Create new semester`);
    const pick = (await rl.question('\nEnter number: ')).trim();

    const choice = Number(pick);
    if (!Number.isInteger(choice) || choice < 1 || choice > semesters.length + 1) {
      fail(`invalid selection "${pick}"`);
    }

    let semester;
    if (choice === semesters.length + 1) {
      semester = (await rl.question('New semester name (e.g. SPRING-2027): ')).trim();
      if (!semester) fail('semester name is required');
      ensureDir(semesterDir(semester), `Semester "${semester}"`);
    } else {
      semester = semesters[choice - 1];
    }

    const course = (await rl.question(`Course name in "${semester}": `)).trim();
    if (!course) fail('course name is required');
    scaffoldCourse(semester, course);
  } finally {
    rl.close();
  }
}

const commands = {
  init(args) {
    const semester = args[0];
    if (!semester) fail('usage: edu init <SEMESTER>   (e.g. edu init FALL-2026)');
    ensureDir(semesterDir(semester), `Semester "${semester}"`);
  },

  async course(args) {
    // "edu course create" (or just "edu course") → interactive semester picker.
    if (!args[0] || args[0] === 'create') {
      await createCourseInteractive();
      return;
    }
    const [semester, course] = args;
    if (!course) {
      fail('usage: edu course <SEMESTER> "<Course Name>"   or   edu course create');
    }
    if (!existsSync(semesterDir(semester))) {
      fail(`semester "${semester}" not found — run: edu init "${semester}"  (or use: edu course create)`);
    }
    scaffoldCourse(semester, course);
  },

  list(args) {
    const what = args[0];
    if (what === 'semesters' || !what) {
      const semesters = readdirSync(ROOT, { withFileTypes: true })
        .filter((d) => d.isDirectory() && !d.name.startsWith('.') && d.name !== 'bin' && d.name !== 'src')
        .map((d) => d.name);
      console.log('Semesters:');
      for (const s of semesters) console.log(`  ${s}`);
      return;
    }
    const [_, semester] = args;
    if (what === 'courses') {
      if (!semester) fail('usage: edu list courses <SEMESTER>');
      const dir = semesterDir(semester);
      if (!existsSync(dir)) fail(`semester "${semester}" not found`);
      const courses = readdirSync(dir, { withFileTypes: true })
        .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
        .map((d) => d.name);
      console.log(`Courses in ${semester}:`);
      for (const c of courses) console.log(`  ${c}`);
      return;
    }
    fail(`unknown list target "${what}" (use: semesters | courses <SEMESTER>)`);
  },

  open(args) {
    const target = args[0];
    if (!target) fail('usage: edu open <SEMESTER> [Course Name]');
    const path = args[1] ? courseDir(target, args[1]) : semesterDir(target);
    if (!existsSync(path)) fail(`path not found: ${path}`);
    spawnSync('open', [path], { stdio: 'inherit' });
  },

  help() {
    console.log(`edu — semester & course scaffolding CLI

Usage:
  edu init <SEMESTER>                    Create a semester folder (e.g. FALL-2026)
  edu course <SEMESTER> "<Course Name>"  Create a course with LECTURES/ and NOTES/
  edu course create                      Interactive: pick a semester, then name the course
  edu list semesters                     List all semesters
  edu list courses <SEMESTER>            List courses in a semester
  edu open <SEMESTER> [Course Name]      Open folder in Finder

Structure created:
  <SEMESTER>/
    └── <Course Name>/
          ├── LECTURES/   (lecture PDFs, e.g. 1.pdf)
          ├── NOTES/      (Markdown notes per lecture)
          └── AGENTS.md
`);
  },
};

const [command, ...args] = process.argv.slice(2);
if (!command || command === '--help' || command === '-h') {
  commands.help();
  process.exit(0);
}
if (!commands[command]) {
  fail(`unknown command "${command}" — run "edu help"`);
}
Promise.resolve(commands[command](args)).catch((err) => {
  console.error(`error: ${err.message}`);
  process.exit(1);
});
