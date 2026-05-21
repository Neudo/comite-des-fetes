import { useEffect } from 'react'
import { site } from '@/lib/site'

interface SeoProps {
  title: string
  description?: string
  path?: string
  noindex?: boolean
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let meta = document.head.querySelector(selector) as HTMLMetaElement | null
  if (!meta) {
    meta = document.createElement('meta')
    document.head.appendChild(meta)
  }
  for (const [key, value] of Object.entries(attributes)) {
    meta.setAttribute(key, value)
  }
}

function upsertLink(selector: string, attributes: Record<string, string>) {
  let link = document.head.querySelector(selector) as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    document.head.appendChild(link)
  }
  for (const [key, value] of Object.entries(attributes)) {
    link.setAttribute(key, value)
  }
}

export function Seo({ title, description, path = '/', noindex = false, jsonLd }: SeoProps) {
  useEffect(() => {
    const fullTitle = `${title} | ${site.shortName}`
    const metaDescription = description ?? site.description
    const canonical = new URL(path, site.url).toString()
    const robots = noindex ? 'noindex, nofollow' : 'index, follow'

    document.title = fullTitle
    upsertMeta('meta[name="description"]', { name: 'description', content: metaDescription })
    upsertMeta('meta[name="robots"]', { name: 'robots', content: robots })
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' })
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle })
    upsertMeta('meta[property="og:description"]', {
      property: 'og:description',
      content: metaDescription,
    })
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical })
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: 'fr_FR' })
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary' })
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: fullTitle })
    upsertMeta('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: metaDescription,
    })
    upsertLink('link[rel="canonical"]', { rel: 'canonical', href: canonical })

    const scriptId = 'site-jsonld'
    const previous = document.getElementById(scriptId)
    if (previous) previous.remove()

    if (jsonLd) {
      const script = document.createElement('script')
      script.id = scriptId
      script.type = 'application/ld+json'
      script.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(script)
    }

    return () => {
      const current = document.getElementById(scriptId)
      if (current) current.remove()
    }
  }, [description, jsonLd, noindex, path, title])

  return null
}
