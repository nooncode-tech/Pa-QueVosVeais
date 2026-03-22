// Pa' Que Vos Veáis — Service Worker
// Strategy: Network-first for API/Supabase; Cache-first for static assets

const CACHE_NAME = 'pqvv-v1'
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
]

// Install: pre-cache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: routing strategy
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests and chrome-extension
  if (request.method !== 'GET') return
  if (!url.protocol.startsWith('http')) return

  // Network-first for API calls and Supabase
  const isApi =
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('stripe.com')

  if (isApi) {
    event.respondWith(
      fetch(request).catch(() => {
        // Return a JSON error when offline so the app can handle it gracefully
        return new Response(
          JSON.stringify({ error: 'Sin conexión. Los datos se sincronizarán al reconectar.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      })
    )
    return
  }

  // Cache-first for Next.js static assets (_next/static/*)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          return response
        })
      })
    )
    return
  }

  // Network-first with cache fallback for pages
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful page responses
        if (response.ok && response.type === 'basic') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached
          // Offline fallback: serve the cached homepage
          return caches.match('/')
        })
      })
  )
})
