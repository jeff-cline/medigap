'use client'

import { useEffect } from 'react'

// Visitor identification. Assigns a first-party id, records the page and the
// campaign parameters, and links it to the account once someone signs up — so
// the funnel is measurable before an account exists.
//
// Deliberately narrow: a page path and a coarse campaign source. No health
// information is ever recorded here, because a page about dense breasts is a
// sensitive thing to know about someone.
export default function VisitorId() {
  useEffect(() => {
    try {
      const KEY = 'mx_vid'
      let vid = localStorage.getItem(KEY)
      if (!vid) {
        vid = (crypto.randomUUID?.() ?? String(Date.now()) + Math.random().toString(36).slice(2))
        localStorage.setItem(KEY, vid)
      }
      document.cookie = `mx_vid=${vid}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`

      const q = new URLSearchParams(location.search)
      const utm: Record<string, string> = {}
      for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid']) {
        const v = q.get(k)
        if (v) utm[k] = v.slice(0, 120)
      }

      navigator.sendBeacon?.(
        '/api/mammo/visit',
        new Blob([JSON.stringify({ visitorId: vid, path: location.pathname, referer: document.referrer, utm })],
          { type: 'application/json' }),
      )
    } catch {
      // Analytics must never break the page.
    }
  }, [])
  return null
}
