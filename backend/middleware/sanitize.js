function isObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function deepSanitize(obj) {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = deepSanitize(obj[i])
    }
    return obj
  }
  if (isObject(obj)) {
    for (const key of Object.keys(obj)) {
      // Drop dangerous keys
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key]
        continue
      }
      obj[key] = deepSanitize(obj[key])
    }
    return obj
  }
  return obj
}

module.exports = function sanitize(req, _res, next) {
  try {
    if (req.body) req.body = deepSanitize(req.body)
    if (req.query) req.query = deepSanitize(req.query)
    if (req.params) req.params = deepSanitize(req.params)
  } catch (_) {
    // best-effort sanitization
  }
  next()
}

