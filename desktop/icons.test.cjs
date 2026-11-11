const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const sharp = require('sharp')
const { generateIcons } = require('./icons.cjs')

test('Xuly icons use the supplied artwork, opaque green backgrounds and safe maskable bounds', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'xuly-icons-'))
  try {
    await generateIcons({ dir, source: path.join(__dirname, '..', 'public', 'icons', 'logo_source.jpg') })
    for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180], ['icon-maskable-512.png', 512]]) {
      const file = path.join(dir, name)
      const meta = await sharp(file).metadata()
      assert.equal(meta.width, size); assert.equal(meta.height, size)
      assert.equal((await sharp(file).stats()).isOpaque, true)
      const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true })
      assert.ok(data[1] > data[0] && data[1] > data[2], 'Corner is green, not white')
      let gold = 0
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const i = (y * size + x) * info.channels
        if (data[i] > 120 && data[i] - data[i + 2] > 60) {
          gold++
          if (name.includes('maskable')) assert.ok(Math.hypot(x - size / 2, y - size / 2) <= size * .4, 'Gold stays in the safe circle')
        }
      }
      assert.ok(gold > size * size * .02, 'Gold symbol is present')
    }
    const svg = await fs.readFile(path.join(dir, 'icon.svg'), 'utf8')
    assert.ok(svg.includes('data:image/png;base64,'))
    const ico = await fs.readFile(path.join(dir, 'icon.ico'))
    assert.equal(ico.readUInt16LE(2), 1); assert.equal(ico.readUInt16LE(4), 7)
    assert.equal((await sharp(path.join(dir, 'logo.png')).metadata()).width, 1024)
  } finally {
    await fs.rm(dir, { recursive: true, force: true })
  }
})