const fs = require('node:fs/promises')
const path = require('node:path')
const sharp = require('sharp')

async function generateIcons({ dir = path.join(__dirname, '..', 'public', 'icons'), source = path.join(dir, 'logo_source.jpg') } = {}) {
  const { data, info } = await sharp(source).rotate().removeAlpha().toColourspace('srgb').raw().toBuffer({ resolveWithObject: true })
  // Coordinates are proportional to the supplied Xuly artwork, not the old icon.
  const left = Math.round(info.width * .215), top = Math.round(info.height * .19)
  const width = Math.round(info.width * .54), height = Math.round(info.height * .53)
  const background = { r: data[0], g: data[1], b: data[2], alpha: 1 }
  const symbol = Buffer.alloc(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const from = ((top + y) * info.width + left + x) * info.channels
      const to = (y * width + x) * 4
      symbol[to] = data[from]; symbol[to + 1] = data[from + 1]; symbol[to + 2] = data[from + 2]
      // Separate the gold mark from the photographed green background while
      // preserving its gradient. This avoids a visible square around the mark.
      symbol[to + 3] = Math.round(255 * Math.max(0, Math.min(1, (data[from] - data[from + 2] - 15) / 50)))
    }
  }
  const mark = await sharp(symbol, { raw: { width, height, channels: 4 } }).png().toBuffer()
  const render = async (size, ratio = .84) => {
    const inner = Math.round(size * ratio)
    const image = await sharp(mark).resize(inner, inner, { fit: 'contain', background: '#00000000' }).png().toBuffer()
    const offset = Math.floor((size - inner) / 2)
    return sharp({ create: { width: size, height: size, channels: 3, background } })
      .composite([{ input: image, left: offset, top: offset }]).png().toBuffer()
  }
  const png = size => render(size)
  await fs.mkdir(dir, { recursive: true })
  await sharp(source).rotate().resize({ width: 1024 }).png().toFile(path.join(dir, 'logo.png'))
  const icon = await png(512)
  await fs.writeFile(path.join(dir, 'icon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><image width="512" height="512" href="data:image/png;base64,${icon.toString('base64')}" /></svg>\n`)
  await Promise.all([
    ['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180],
  ].map(async ([name, size]) => fs.writeFile(path.join(dir, name), await png(size))))
  // A 280px square fits wholly inside the central 80%-diameter safe circle.
  await fs.writeFile(path.join(dir, 'icon-maskable-512.png'), await render(512, 280 / 512))
  const sizes = [16, 24, 32, 48, 64, 128, 256]
  const images = await Promise.all(sizes.map(png))
  const header = Buffer.alloc(6 + sizes.length * 16)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(sizes.length, 4)
  let offset = header.length
  images.forEach((image, i) => {
    const entry = 6 + i * 16
    header[entry] = header[entry + 1] = sizes[i] % 256
    header.writeUInt16LE(1, entry + 4)
    header.writeUInt16LE(32, entry + 6)
    header.writeUInt32LE(image.length, entry + 8)
    header.writeUInt32LE(offset, entry + 12)
    offset += image.length
  })
  await fs.writeFile(path.join(dir, 'icon.ico'), Buffer.concat([header, ...images]))
  console.log('Generated Xuly logo, web, PWA, iOS and Windows icons from logo_source.jpg')
}

if (require.main === module) generateIcons().catch(error => { console.error(error); process.exitCode = 1 })
module.exports = { generateIcons }