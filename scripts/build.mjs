// Builds dist/index.html: one self-contained file with the styles, sql.js, the Northwind database,
// the engine, the content and the app all inlined. Run with `npm run build` (which runs the checks first).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const parts = [
  ['/*__CSS__*/', read('src/styles.css')],
  ['/*__ENGINE__*/', read('src/engine.js')],
  ['/*__CONTENT__*/', read('src/content/lessons.js') + '\n' + read('src/content/quizzes.js') + '\n' + read('src/content/dialects.js') + '\n' + read('src/content/intro.js') + '\n' + read('src/content/install.js') + '\n' + read('src/content/capstone.js')],
  ['/*__APP__*/', read('src/app.js') + '\n' + read('src/quiz.js') + '\n' + read('src/game.js')],
  ['/*__SQLJS__*/', read('node_modules/sql.js/dist/sql-asm-memory-growth.js')],
  ['__NWDB__', fs.readFileSync(path.join(root, 'data/northwind.db')).toString('base64')],
];

const dataUri = (p, type) => `data:${type};base64,${fs.readFileSync(path.join(root, p)).toString('base64')}`;
const assets = [
  ['__SPARTA_LOGO__', dataUri('src/assets/sparta-logo.png', 'image/png')],
  ['__SPARTA_LOGO_WHITE__', dataUri('src/assets/sparta-logo-white.png', 'image/png')],
  ['__FAVICON__', dataUri('src/assets/favicon.svg', 'image/svg+xml')],
];

let html = read('src/index.html');
// Images are inlined as data URIs so the site stays a single file
for (const [marker, value] of assets) {
  if (!html.includes(marker)) throw new Error(`Placeholder ${marker} is missing from src/index.html`);
  html = html.split(marker).join(value);
}
for (const [marker, value] of parts) {
  const at = html.indexOf(marker);
  if (at < 0) throw new Error(`Placeholder ${marker} is missing from src/index.html`);
  if (marker !== '/*__CSS__*/' && /<\/script/i.test(value)) throw new Error(`${marker}: the text "</script" would end the script early`);
  html = html.slice(0, at) + value + html.slice(at + marker.length);
}

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
// Files learners can download (such as the MySQL Northwind script) are copied as they are
fs.cpSync(path.join(root, 'public'), path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/index.html'), html);
console.log(`Built dist/index.html (${(html.length / 1024 / 1024).toFixed(2)} MB)`);
