#!/usr/bin/env node

const puppeteer = require('puppeteer')

async function checkPage(page, url) {
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })

  // Give the app a moment to finish any animations/rendering
  await page.waitForTimeout(500)

  const result = await page.evaluate(() => {
    const icons = Array.from(document.querySelectorAll('.lucide'))
    const details = icons.map((el) => {
      const rect = el.getBoundingClientRect()
      const style = window.getComputedStyle(el)
      return {
        className: el.getAttribute('class') || '',
        width: rect.width,
        height: rect.height,
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
      }
    })

    const tooSmall = details.filter(
      (d) => d.display !== 'none' && d.visibility !== 'hidden' && (d.width < 10 || d.height < 10)
    )
    const hidden = details.filter((d) => d.display === 'none' || d.visibility === 'hidden' || d.opacity === '0')

    return {
      total: details.length,
      tooSmall: tooSmall.length,
      hidden: hidden.length,
      examples: details.slice(0, 5),
    }
  })

  return result
}

async function main() {
  const base = process.env.CHECK_BASE_URL || 'http://127.0.0.1:5173'
  const routes = [
    '/',
    '/products',
    '/vendors',
    '/contact',
    '/help-center',
    '/shipping-info',
    '/privacy-policy',
    '/terms-of-service',
    '/cookie-policy',
  ]

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()

  const report = []
  for (const route of routes) {
    const url = base + route
    try {
      const res = await checkPage(page, url)
      report.push({ route, ok: true, ...res })
      // eslint-disable-next-line no-console
      console.log(`[icons] ${route} => total: ${res.total}, tooSmall: ${res.tooSmall}, hidden: ${res.hidden}`)
    } catch (err) {
      report.push({ route, ok: false, error: err.message })
      // eslint-disable-next-line no-console
      console.error(`[icons] ${route} => error: ${err.message}`)
    }
  }

  await browser.close()

  const broken = report.filter((r) => r.ok && (r.tooSmall > 0 || r.hidden > 0))
  const failures = report.filter((r) => !r.ok)
  if (broken.length || failures.length) {
    // eslint-disable-next-line no-console
    console.error(`\nIcon audit found issues on ${broken.length} routes and ${failures.length} failures.`)
    process.exitCode = 1
  } else {
    // eslint-disable-next-line no-console
    console.log('\nIcon audit passed on all routes.')
  }
}

main().catch((e) => {
  console.error('Icon audit failed:', e)
  process.exit(1)
})

