#!/usr/bin/env node

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')

const rootDir = __dirname
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const E2E_BACKEND_PORT = process.env.E2E_BACKEND_PORT || '5050'
const E2E_FRONTEND_PORT = process.env.E2E_FRONTEND_PORT || '5190'
const E2E_BACKEND_HOST = process.env.E2E_BACKEND_HOST || '127.0.0.1'
const E2E_FRONTEND_HOST = process.env.E2E_FRONTEND_HOST || '127.0.0.1'
const backendOrigin = `http://${E2E_BACKEND_HOST}:${E2E_BACKEND_PORT}`
const frontendOrigin = `http://${E2E_FRONTEND_HOST}:${E2E_FRONTEND_PORT}`
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options,
    })

    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
      }
    })

    child.on('error', (error) => reject(error))
  })
}

async function ensureRootDependencies() {
  const nodeModulesPath = path.join(rootDir, 'node_modules')
  const puppeteerPath = path.join(nodeModulesPath || '', 'puppeteer')
  if (fs.existsSync(puppeteerPath)) {
    console.log('[e2e] Root dependencies already installed')
    return
  }

  console.log('[e2e] Installing root dev dependencies (including puppeteer)...')
  await runCommand(npmCommand, ['install'], { cwd: rootDir })
}

function waitForEndpoint(url, { timeout = 120000, interval = 1500 } = {}) {
  return new Promise((resolve, reject) => {
    const start = Date.now()

    const attempt = () => {
      const client = url.startsWith('https') ? https : http
      const request = client.get(url, (response) => {
        const { statusCode } = response
        response.resume()

        if (statusCode && statusCode >= 200 && statusCode < 400) {
          resolve()
        } else if (Date.now() - start >= timeout) {
          reject(new Error(`Timed out waiting for ${url} (status ${statusCode})`))
        } else {
          setTimeout(attempt, interval)
        }
      })

      request.on('error', () => {
        if (Date.now() - start >= timeout) {
          reject(new Error(`Timed out waiting for ${url}`))
        } else {
          setTimeout(attempt, interval)
        }
      })
    }

    attempt()
  })
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60) || 'step'
}

function makeStepRecorder({ flowName, flowDir, steps }) {
  let index = 0
  return async function recordStep(page, title, description) {
    index += 1
    const filename = `${String(index).padStart(2, '0')}-${slugify(title)}.png`
    const filepath = path.join(flowDir, filename)
    await page.screenshot({ path: filepath, fullPage: true })
    const relPath = path.relative(rootDir, filepath).replace(/\\/g, '/')
    steps.push({ step: index, title, description, screenshot: relPath })
    console.log(`[e2e][${flowName}] step ${index}: ${title} -> ${relPath}`)
  }
}

async function clearAndType(page, selector, value) {
  await page.waitForSelector(selector, { timeout: 15000 })
  await page.focus(selector)
  await page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) return
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.value = ''
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }, selector)
  if (value) {
    await page.type(selector, value, { delay: 20 })
  }
  const currentValue = await page.$eval(selector, (el) => el.value)
  if (value && String(currentValue) !== String(value)) {
    throw new Error(`Failed to set ${selector} to expected value`)
  }
}

async function runCustomerFlow({ browser, flowDir }) {
  const context = await browser.createBrowserContext()
  const page = await context.newPage()
  await page.setViewport({ width: 1280, height: 720 })
  page.on('console', (msg) => console.log(`[e2e][customer][console] ${msg.type()}: ${msg.text()}`))
  page.on('pageerror', (err) => console.error('[e2e][customer][pageerror]', err && err.stack ? err.stack : err))
  page.on('request', (req) => {
    if (req.url().startsWith(backendOrigin)) {
      console.log(`[e2e][customer][request] ${req.method()} ${req.url()}`)
    }
  })
  page.on('response', (res) => {
    if (res.url().startsWith(backendOrigin)) {
      console.log(`[e2e][customer][response] ${res.status()} ${res.url()}`)
    }
  })
  const steps = []
  const recordStep = makeStepRecorder({ flowName: 'customer', flowDir, steps })
  try {
    await page.goto(`${frontendOrigin}/`, { waitUntil: 'networkidle2', timeout: 90000 })
    await recordStep(page, 'Home (guest)', 'Landing page before customer authentication')

    await Promise.all([
      page.waitForFunction((expected) => window.location.pathname === expected, { timeout: 15000 }, '/login'),
      page.click('[data-testid="nav-login"]')
    ])
    await page.waitForSelector('form', { timeout: 15000 })
    await recordStep(page, 'Login form', 'Customer login screen via navbar CTA')

    await page.click('input[name="email"]')
    await page.type('input[name="email"]', 'demo@snafles.com', { delay: 20 })
    await page.click('input[name="password"]')
    await page.type('input[name="password"]', 'demo123', { delay: 20 })
    await recordStep(page, 'Credentials entered', 'Demo customer email and password filled in')

    await page.evaluate(() => {
      const passwordField = document.querySelector('input[name="password"]')
      const form = passwordField ? passwordField.closest('form') : null
      if (form && typeof form.requestSubmit === 'function') {
        form.requestSubmit()
      }
    })
    const loginResponse = await page.waitForResponse(
      (res) => res.url().startsWith(`${backendOrigin}/api/auth/login`) && res.request().method() === 'POST',
      { timeout: 20000 }
    )
    if (!loginResponse.ok()) {
      throw new Error(`Customer login failed with status ${loginResponse.status()}`)
    }
    await page.waitForSelector('[data-testid="nav-user-menu"]', { timeout: 15000 })
    await page.goto(`${frontendOrigin}/profile`, { waitUntil: 'networkidle2', timeout: 90000 })
    await page.waitForFunction(() => document.body.innerText.includes('Snafles Account'), { timeout: 15000 })
    await recordStep(page, 'Profile dashboard', 'Authenticated profile view confirms login')

    await page.goto(`${frontendOrigin}/products`, { waitUntil: 'networkidle2', timeout: 90000 })
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 15000 })
    await recordStep(page, 'Browse products', 'Product catalog while logged in')

    // Navigate to first product detail where a clear "Add to Cart" button exists
    await Promise.all([
      page.waitForFunction(() => window.location.pathname.startsWith('/product/'), { timeout: 20000 }),
      page.click('[data-testid="product-link"]')
    ])
    await page.waitForFunction(() => document.body.innerText.includes('Add to Cart') || document.body.innerText.includes('In Cart'), { timeout: 20000 })

    const addedOnDetail = await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="add-to-cart-btn"]')
      if (btn && !/In Cart/i.test(btn.textContent || '')) { btn.click(); return true }
      return !!btn
    })
    if (!addedOnDetail) {
      throw new Error('Could not add item from product detail')
    }
    await delay(800)
    await recordStep(page, 'Item added to cart', 'Added product to cart from detail page')

    await page.goto(`${frontendOrigin}/cart`, { waitUntil: 'networkidle2', timeout: 90000 })
    await page.waitForSelector('[data-testid="cart-title"]', { timeout: 15000 })
    await recordStep(page, 'Cart overview', 'Cart shows items after login workflow')

    // Proceed to checkout and verify shipping form appears
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 90000 }),
      page.click('[data-testid="checkout-btn"]')
    ])
    await page.waitForFunction(() => document.body.innerText.includes('Shipping Information'), { timeout: 20000 })
    await recordStep(page, 'Checkout - shipping', 'Checkout page shows shipping form')

    await clearAndType(page, 'input[name="firstName"]', 'Demo')
    await clearAndType(page, 'input[name="lastName"]', 'Customer')
    await clearAndType(page, 'input[name="email"]', 'demo@snafles.com')
    await clearAndType(page, 'input[name="phone"]', '+919876543210')
    await clearAndType(page, 'textarea[name="address"]', '123 Demo Street\nDemo City, IN')
    await clearAndType(page, 'input[name="city"]', 'Mumbai')
    await clearAndType(page, 'input[name="state"]', 'Maharashtra')
    await clearAndType(page, 'input[name="zipCode"]', '400001')

    // Continue to payment
    await Promise.all([
      page.waitForSelector('[data-testid="checkout-payment-section"]', { timeout: 20000 }),
      page.click('[data-testid="checkout-continue"]')
    ])

    // Place order; ensure request resolves to avoid premature timeout
    const orderResponsePromise = page.waitForResponse(
      (res) => res.url().startsWith(`${backendOrigin}/api/orders`) && res.request().method() === 'POST',
      { timeout: 40000 }
    )
    await page.waitForSelector('[data-testid="checkout-place-order"]:not([disabled])', { timeout: 20000 })
    await page.click('[data-testid="checkout-place-order"]')
    const orderResponse = await orderResponsePromise
    if (!orderResponse.ok()) {
      throw new Error(`Order submission failed with status ${orderResponse.status()}`)
    }

    await page.waitForFunction(() => document.body.innerText.includes('Order Confirmed!'), { timeout: 30000 })
    await recordStep(page, 'Order confirmed', 'Order flow completed with confirmation')

    return { steps }
  } catch (error) {
    return { steps, error }
  } finally {
    await context.close()
  }
}

async function runVendorFlow({ browser, flowDir }) {
  const context = await browser.createBrowserContext()
  const page = await context.newPage()
  await page.setViewport({ width: 1280, height: 720 })
  page.on('console', (msg) => console.log(`[e2e][vendor][console] ${msg.type()}: ${msg.text()}`))
  page.on('pageerror', (err) => console.error('[e2e][vendor][pageerror]', err && err.stack ? err.stack : err))
  page.on('request', (req) => {
    if (req.url().startsWith(backendOrigin)) {
      console.log(`[e2e][vendor][request] ${req.method()} ${req.url()}`)
    }
  })
  page.on('response', (res) => {
    if (res.url().startsWith(backendOrigin)) {
      console.log(`[e2e][vendor][response] ${res.status()} ${res.url()}`)
    }
  })
  const steps = []
  const recordStep = makeStepRecorder({ flowName: 'vendor', flowDir, steps })

  try {
    await page.goto(`${frontendOrigin}/`, { waitUntil: 'networkidle2', timeout: 90000 })
    await recordStep(page, 'Home (guest)', 'Storefront landing page before vendor login')

    await Promise.all([
      page.waitForFunction((expected) => window.location.pathname === expected, { timeout: 15000 }, '/vendor-login'),
      page.click('[data-testid="nav-vendor-login"]')
    ])
    await page.waitForFunction(() => document.body.innerText.includes('Vendor Login'), { timeout: 15000 })
    await recordStep(page, 'Vendor login form', 'Dedicated vendor authentication screen')

    const fillVendorDemo = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((el) =>
        el.textContent && el.textContent.includes('Fill Demo Credentials')
      )
      if (btn) {
        btn.click()
        return true
      }
      return false
    })
    if (fillVendorDemo) {
      await page.waitForFunction(
        () => document.querySelector('input[name="email"]').value.includes('vendor@snafles.com'),
        { timeout: 5000 }
      )
    } else {
      await page.click('input[name="email"]')
      await page.type('input[name="email"]', 'vendor@snafles.com', { delay: 20 })
      await page.click('input[name="password"]')
      await page.type('input[name="password"]', 'vendor123', { delay: 20 })
    }
    await recordStep(page, 'Credentials ready', 'Vendor demo credentials populated')

    await page.evaluate(() => {
      const passwordField = document.querySelector('input[name="password"]')
      const form = passwordField ? passwordField.closest('form') : null
      if (form && typeof form.requestSubmit === 'function') {
        form.requestSubmit()
      }
    })
    const vendorLoginResponse = await page.waitForResponse(
      (res) => res.url().startsWith(`${backendOrigin}/api/auth/vendor-login`) && res.request().method() === 'POST',
      { timeout: 20000 }
    )
    if (!vendorLoginResponse.ok()) {
      throw new Error(`Vendor login failed with status ${vendorLoginResponse.status()}`)
    }
    await page.waitForSelector('[data-testid="nav-user-menu"]', { timeout: 15000 })
    await page.waitForFunction((expected) => window.location.pathname === expected, { timeout: 20000 }, '/dashboard/vendor')
    await page.waitForFunction(() => document.body.innerText.includes('Vendor Dashboard'), { timeout: 15000 })
    await recordStep(page, 'Vendor dashboard', 'Vendor dashboard overview after login')

    const openedProducts = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const target = buttons.find((el) => el.textContent && el.textContent.trim().startsWith('Products'))
      if (target) {
        target.click()
        return true
      }
      return false
    })
    if (openedProducts) {
      await delay(500)
      await recordStep(page, 'Products tab', 'Product management view for vendor')
    }

    const openedSettings = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const target = buttons.find((el) => el.textContent && el.textContent.trim().startsWith('Settings'))
      if (target) {
        target.click()
        return true
      }
      return false
    })
    if (openedSettings) {
      await delay(500)
      await recordStep(page, 'Settings tab', 'Vendor profile settings panel')
    }

    return { steps }
  } catch (error) {
    return { steps, error }
  } finally {
    await context.close()
  }
}

async function runAdminFlow({ browser, flowDir }) {
  const context = await browser.createBrowserContext()
  const page = await context.newPage()
  await page.setViewport({ width: 1280, height: 720 })
  page.on('console', (msg) => console.log(`[e2e][admin][console] ${msg.type()}: ${msg.text()}`))
  page.on('pageerror', (err) => console.error('[e2e][admin][pageerror]', err && err.stack ? err.stack : err))
  page.on('request', (req) => {
    if (req.url().startsWith(backendOrigin)) {
      console.log(`[e2e][admin][request] ${req.method()} ${req.url()}`)
    }
  })
  page.on('response', (res) => {
    if (res.url().startsWith(backendOrigin)) {
      console.log(`[e2e][admin][response] ${res.status()} ${res.url()}`)
    }
  })
  const steps = []
  const recordStep = makeStepRecorder({ flowName: 'admin', flowDir, steps })

  try {
    await page.goto(`${frontendOrigin}/`, { waitUntil: 'networkidle2', timeout: 90000 })
    await recordStep(page, 'Home (guest)', 'Storefront landing page before admin login')

    await Promise.all([
      page.waitForFunction((expected) => window.location.pathname === expected, { timeout: 15000 }, '/admin-login'),
      page.click('[data-testid="nav-admin-login"]')
    ])
    await page.waitForFunction(() => document.body.innerText.includes('Admin Login'), { timeout: 15000 })
    await recordStep(page, 'Admin login form', 'Admin authentication screen from header shortcut')

    const fillAdminDemo = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((el) =>
        el.textContent && el.textContent.includes('Fill Demo Credentials')
      )
      if (btn) {
        btn.click()
        return true
      }
      return false
    })
    if (fillAdminDemo) {
      await page.waitForFunction(
        () => document.querySelector('input[name="email"]').value.includes('admin@snafles.com'),
        { timeout: 5000 }
      )
    } else {
      await page.click('input[name="email"]')
      await page.type('input[name="email"]', 'admin@snafles.com', { delay: 20 })
      await page.click('input[name="password"]')
      await page.type('input[name="password"]', 'admin123', { delay: 20 })
    }
    await recordStep(page, 'Credentials ready', 'Admin demo credentials populated')

    await page.evaluate(() => {
      const passwordField = document.querySelector('input[name="password"]')
      const form = passwordField ? passwordField.closest('form') : null
      if (form && typeof form.requestSubmit === 'function') {
        form.requestSubmit()
      }
    })
    const adminLoginResponse = await page.waitForResponse(
      (res) => res.url().startsWith(`${backendOrigin}/api/auth/login`) && res.request().method() === 'POST',
      { timeout: 20000 }
    )
    if (!adminLoginResponse.ok()) {
      throw new Error(`Admin login failed with status ${adminLoginResponse.status()}`)
    }
    await page.waitForSelector('[data-testid="nav-user-menu"]', { timeout: 15000 })
    await page.waitForFunction((expected) => window.location.pathname === expected, { timeout: 20000 }, '/dashboard/admin')
    await page.waitForFunction(() => document.body.innerText.includes('Admin Dashboard'), { timeout: 15000 })
    await recordStep(page, 'Admin dashboard', 'Admin landing analytics after login')

    const openedVendors = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const target = buttons.find((el) => el.textContent && el.textContent.trim().startsWith('Vendors'))
      if (target) {
        target.click()
        return true
      }
      return false
    })
    if (openedVendors) {
      await page.waitForFunction(() => document.body.innerText.includes('Vendor Management'), { timeout: 15000 })
      await recordStep(page, 'Vendors tab', 'Admin vendor management view')
    }

    const openedUsers = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const target = buttons.find((el) => el.textContent && el.textContent.trim().startsWith('Users'))
      if (target) {
        target.click()
        return true
      }
      return false
    })
    if (openedUsers) {
      await page.waitForFunction(() => document.body.innerText.includes('User Management'), { timeout: 15000 })
      await recordStep(page, 'Users tab', 'Admin user management view')
    }

    return { steps }
  } catch (error) {
    return { steps, error }
  } finally {
    await context.close()
  }
}

async function runFlows(browser, artifactsRoot) {
  const flows = [
    { key: 'customer', title: 'Customer login & cart workflow', runner: runCustomerFlow },
    { key: 'vendor', title: 'Vendor dashboard workflow', runner: runVendorFlow },
    { key: 'admin', title: 'Admin dashboard workflow', runner: runAdminFlow },
  ]

  const summary = []
  for (const flow of flows) {
    const flowDir = path.join(artifactsRoot, flow.key)
    fs.mkdirSync(flowDir, { recursive: true })
    try {
      console.log(`[e2e] Running ${flow.key} flow...`)
      const result = await flow.runner({ browser, flowDir })
      const { steps, error } = result
      if (error) {
        console.error(`[e2e] ${flow.key} flow failed:`, error.message || error)
        summary.push({ flow: flow.key, title: flow.title, error: error.message || String(error), steps })
      } else {
        summary.push({ flow: flow.key, title: flow.title, steps })
      }
    } catch (error) {
      console.error(`[e2e] ${flow.key} flow crashed:`, error.message || error)
      summary.push({ flow: flow.key, title: flow.title, error: error.message || String(error), steps: [] })
    }
  }

  return summary
}

let devProcess

process.on('SIGINT', () => {
  console.log('\n[e2e] Caught SIGINT, shutting down...')
  if (devProcess && !devProcess.killed) {
    devProcess.kill('SIGINT')
  }
})

process.on('SIGTERM', () => {
  console.log('\n[e2e] Caught SIGTERM, shutting down...')
  if (devProcess && !devProcess.killed) {
    devProcess.kill('SIGTERM')
  }
})

async function main() {
  await ensureRootDependencies()

  console.log('[e2e] Starting dev environment (mock backend)...')
  devProcess = spawn(
    process.execPath,
    [
      path.join(rootDir, 'run-dev.js'),
      '--mock-backend',
      `--backend-port=${E2E_BACKEND_PORT}`,
      `--frontend-port=${E2E_FRONTEND_PORT}`,
    ],
    {
      stdio: 'inherit',
      cwd: rootDir,
      env: { ...process.env, VITE_E2E: '1' },
    }
  )

  let devProcessExited = false
  devProcess.on('exit', (code, signal) => {
    devProcessExited = true
    const reason = signal ? `signal ${signal}` : `code ${code}`
    console.log(`[e2e] Dev environment exited with ${reason}`)
    if (code !== 0) {
      console.error('[e2e] Dev environment stopped unexpectedly')
      process.exitCode = code || 1
    }
  })

  try {
    await Promise.all([
      waitForEndpoint(`${backendOrigin}/api/health`),
      waitForEndpoint(`${frontendOrigin}/@vite/client`),
    ])
    console.log('[e2e] Servers are ready, running browser checks...')

    if (devProcessExited) {
      throw new Error('Dev environment exited before tests could run')
    }

    const puppeteer = require('puppeteer')
    const browser = await puppeteer.launch({ headless: 'new' })

    const runId = new Date().toISOString().replace(/[:.]/g, '-').replace(/T/, '_')
    const artifactsRoot = path.join(rootDir, 'tests', 'e2e', 'artifacts', runId)
    fs.mkdirSync(artifactsRoot, { recursive: true })

    const flowSummary = await runFlows(browser, artifactsRoot)

    await browser.close()

    const summaryPath = path.join(artifactsRoot, 'summary.json')
    fs.writeFileSync(summaryPath, JSON.stringify({ runId, frontendOrigin, backendOrigin, flows: flowSummary }, null, 2))
    console.log(`[e2e] Smoke flows finished. Summary: ${path.relative(rootDir, summaryPath)}`)
    console.log('[e2e] Smoke test passed')
  } catch (error) {
    console.error('[e2e] Smoke test failed:', error.message)
    process.exitCode = 1
  } finally {
    if (!devProcessExited) {
      console.log('[e2e] Stopping dev environment...')
      devProcess.kill('SIGINT')
      await new Promise((resolve) => devProcess.once('exit', resolve))
    }
  }
}

main().catch((error) => {
  console.error('[e2e] Unexpected error:', error)
  process.exit(1)
})
