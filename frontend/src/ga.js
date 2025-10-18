// Conditionally load Google Analytics only in production and when an ID is provided
const GA_ID = import.meta.env.VITE_GA_ID
const IS_PROD = import.meta.env.PROD
const IS_E2E = !!import.meta.env.VITE_E2E

if (IS_PROD && GA_ID && !IS_E2E) {
  // Inject gtag script
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`
  document.head.appendChild(script)

  // Bootstrap GA
  window.dataLayer = window.dataLayer || []
  function gtag(){ window.dataLayer.push(arguments) }
  // @ts-ignore
  window.gtag = gtag
  gtag('js', new Date())
  gtag('config', GA_ID)
} else {
  // No-op in dev/test or when GA is not configured
}

