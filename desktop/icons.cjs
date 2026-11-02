const fs = require('node:fs/promises')
const path = require('node:path')
const sharp = require('sharp')

async function generateIcons() {
  const dir = path.join(__dirname, '..', 'public', 'icons')
  const source = path.join(dir, 'rosa-logo.jpg')
  // Crop the supplied monogram without redrawing or stretching the artwork.
  const mark = await sharp(source).extract({ left: 376, top: 132, width: 524, height: 720 }).png().toBuffer()
  const png = size => sharp(mark).resize(size, size, { fit: 'contain', background: '#ffffff' }).png().toBuffer()
  const embedded = (await png(512)).toString('base64')
  await fs.writeFile(path.join(dir, 'icon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512"><image width="512" height="512" xlink:href="data:image/png;base64,${embedded}"/></svg>`)
  await Promise.all([
    ['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180],
  ].map(async ([name, size]) => fs.writeFile(path.join(dir, name), await png(size))))
  // Keep the monogram inside the maskable icon's central safe area.
  await sharp({ create: { width: 512, height: 512, channels: 4, background: '#ffffff' } })
    .composite([{ input: await png(320), left: 96, top: 96 }])
    .png().toFile(path.join(dir, 'icon-maskable-512.png'))
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
  console.log('Generated ROSA web, PWA and Windows icons from public/icons/rosa-logo.jpg')
}

if (require.main === module) generateIcons().catch(error => { console.error(error); process.exitCode = 1 })
module.exports = { generateIcons }