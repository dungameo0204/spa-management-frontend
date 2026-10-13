import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const roots = ['src', 'tests', 'desktop', 'public']
const extensions = /\.(?:js|jsx|cjs|mjs|ts|tsx|html|css|svg)$/
// A literal question mark inside a word signals characters lost during encoding.
// U+FFFD is the Unicode replacement character; the other patterns flag common UTF-8 mojibake.
const corrupted = /\ufffd|(?<![\w/])\p{L}\?+\p{L}|[\u00c3\u00c2][\u0080-\u00bf\u00a0-\u00ff]|\u00c4[\u0080-\u00bf]/gu
let errors = 0

function scan(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name)
    if (entry.isDirectory()) { scan(file); continue }
    if (!extensions.test(entry.name)) continue
    const text = readFileSync(file, 'utf8')
    for (const [index, line] of text.split(/\r?\n/).entries()) {
      corrupted.lastIndex = 0
      for (const match of line.matchAll(corrupted)) {
        console.error(`${file}:${index + 1}: ${line.slice(Math.max(0, match.index - 30), match.index + match[0].length + 30)}`)
        errors++
      }
    }
  }
}

for (const root of roots) scan(root)
if (errors) process.exitCode = 1
else console.log('No corrupted Vietnamese text found in application source and tests.')