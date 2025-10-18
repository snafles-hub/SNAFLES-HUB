const crypto = require('crypto')

const CSRF_COOKIE_NAME = 'XSRF-TOKEN'
const CSRF_HEADER_NAME = 'x-csrf-token'
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE'])

function parseCookies(header) {
  const cookies = {}
  if (!header) return cookies

  const pairs = header.split(';')
  for (const pair of pairs) {
    const [rawKey, ...rest] = pair.trim().split('=')
    if (!rawKey) continue
    const key = rawKey
    const value = rest.length > 0 ? rest.join('=') : ''
    try {
      cookies[key] = decodeURIComponent(value)
    } catch (_) {
      cookies[key] = value
    }
  }
  return cookies
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex')
}

function setTokenCookie(res, token, { secure, sameSite } = {}) {
  const isProd = process.env.NODE_ENV === 'production'
  const cookieSecure = typeof secure === 'boolean' ? secure : isProd
  const siteSetting = sameSite || (cookieSecure ? 'strict' : 'lax')

  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: cookieSecure,
    sameSite: siteSetting,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  })
}

function csrfMiddleware(options = {}) {
  const cookieSecure = options.secure
  const sameSite = options.sameSite

  return function csrf(req, res, next) {
    const cookies = parseCookies(req.headers?.cookie || '')
    let cookieToken = cookies[CSRF_COOKIE_NAME]

    if (!cookieToken) {
      cookieToken = generateToken()
      setTokenCookie(res, cookieToken, { secure: cookieSecure, sameSite })
    }

    // Expose token for downstream handlers (e.g., to rotate on login)
    res.locals.csrfToken = cookieToken

    if (SAFE_METHODS.has(req.method)) {
      return next()
    }

    const headerToken = req.headers[CSRF_HEADER_NAME]
    if (!headerToken || headerToken !== cookieToken) {
      return res.status(403).json({ message: 'Invalid CSRF token' })
    }

    return next()
  }
}

csrfMiddleware.generateToken = generateToken
csrfMiddleware.setTokenCookie = setTokenCookie
csrfMiddleware.cookieName = CSRF_COOKIE_NAME
csrfMiddleware.headerName = CSRF_HEADER_NAME
csrfMiddleware.parseCookies = parseCookies

module.exports = csrfMiddleware
