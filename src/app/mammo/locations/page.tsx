import type { Metadata } from 'next'
import { activeLocations, fullAddress } from '@/lib/mammo-locations'
import { getMammoSession } from '@/lib/mammo-auth'
import Link from 'next/link'
import { SITE, LOCATION_FAQS, SEO_PAGES } from '@/lib/mammo'
import FaqBlock from '@/components/mammo/FaqBlock'
import { MammoHeader, MammoFooter } from '@/components/mammo/Chrome'
import LocationPicker from '@/components/mammo/LocationPicker'
import VisitorId from '@/components/mammo/VisitorId'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Screening Locations — Mammo Express',
  description: 'Find an FDA-certified mammography location near you, see the address and phone number, and book a time on their calendar.',
  alternates: { canonical: `${SITE}/locations` },
}

export default async function Locations() {
  const [locs, session] = await Promise.all([activeLocations(), getMammoSession().catch(() => null)])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: locs.map((l, i) => ({
      '@type': 'ListItem', position: i + 1,
      item: {
        '@type': 'MedicalClinic', name: l.name, telephone: l.phone || undefined,
        address: { '@type': 'PostalAddress', streetAddress: l.address1, addressLocality: l.city, addressRegion: l.state, postalCode: l.zip, addressCountry: 'US' },
        ...(l.lat != null && l.lng != null ? { geo: { '@type': 'GeoCoordinates', latitude: l.lat, longitude: l.lng } } : {}),
      },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <VisitorId />
      <MammoHeader />
      <main className="bg-[#FFFFFF] text-[#2E1065] min-h-[60vh]">
        <div className="max-w-6xl mx-auto px-4 py-14 md:py-20">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">Find your location</h1>
          <p className="text-xl text-[#2E1065]/70 max-w-2xl mb-10">
            Every location here is an independent, FDA-certified mammography facility. Pick the one
            that suits you and you will go straight to their calendar.
          </p>
          <LocationPicker locations={locs} signedIn={Boolean(session)} />
          {locs.length > 0 && (
            <p className="mt-10 text-sm text-[#2E1065]/55 max-w-3xl">
              Addresses and phone numbers are provided by each facility. Mammo Express does not
              perform imaging or interpret results — your exam is with the facility you choose.
            </p>
          )}

          <div className="mt-16 pt-14 border-t border-[#2E1065]/10 max-w-3xl">
            <FaqBlock faqs={LOCATION_FAQS} title="Questions about locations" />
          </div>

          <nav className="mt-14 pt-10 border-t border-[#2E1065]/10 max-w-3xl">
            <h2 className="text-xl font-black mb-5">Read next</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Link href="/prepare" className="rounded-2xl border-2 border-[#7C3AED]/30 hover:border-[#7C3AED]/50 bg-white p-5 transition-colors">
                <span className="font-black">How to prepare for your visit</span>
              </Link>
              {SEO_PAGES.filter((p) => ['walk-in-mammogram-near-me', 'mammogram-without-a-doctor-referral', 'mammogram-cost-and-insurance'].includes(p.slug)).map((p) => (
                <Link key={p.slug} href={`/answers/${p.slug}`}
                  className="rounded-2xl border-2 border-[#7C3AED]/30 hover:border-[#7C3AED]/50 bg-white p-5 transition-colors">
                  <span className="font-black">{p.h1}</span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </main>
      <MammoFooter />
    </>
  )
}
