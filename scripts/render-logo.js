#!/usr/bin/env node
// Converts frontend/public/logo.svg to frontend/public/images/logo.png
// Requires: sharp

const fs = require('fs')
const path = require('path')

async function main() {
  const sharp = require('sharp')
  const repoRoot = __dirname ? path.resolve(__dirname, '..') : process.cwd()
  const srcSvg = path.join(repoRoot, 'frontend', 'public', 'logo.svg')
  const outDir = path.join(repoRoot, 'frontend', 'public', 'images')
  const outPng = path.join(outDir, 'logo.png')

  if (!fs.existsSync(srcSvg)) {
    console.error(`[render-logo] Missing source SVG at ${srcSvg}`)
    process.exit(1)
  }
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  const svgBuffer = fs.readFileSync(srcSvg)

  // Render at a crisp width; height is inferred from SVG viewBox
  const width = 700 // matches viewBox width of the SVG for 1x

  await sharp(svgBuffer, { density: 300 })
    .resize({ width, withoutEnlargement: false })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outPng)

  console.log(`[render-logo] Wrote ${outPng}`)
}

main().catch((err) => {
  console.error('[render-logo] Failed:', err)
  process.exit(1)
})

