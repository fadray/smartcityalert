import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'SmartCityAlert - Report & Track Incidents',
  description: 'Report and track incidents in your community',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="bg-blue-600 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex flex-col sm:flex-row justify-between items-center">
                <Link href="/" className="text-2xl font-bold">🏙️ SmartCityAlert</Link>
                <nav className="flex gap-4 mt-2 sm:mt-0">
                  <Link href="/" className="hover:text-blue-200 transition">Home</Link>
                  <Link href="/report" className="hover:text-blue-200 transition">Report</Link>
                  <Link href="/status" className="hover:text-blue-200 transition">Track Status</Link>
                </nav>
              </div>
            </div>
          </header>
          <main className="flex-grow bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">{children}</div>
          </main>
          <footer className="bg-gray-800 text-white">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="flex flex-col sm:flex-row justify-between items-center text-sm">
                <span>© 2024 SmartCityAlert. All rights reserved.</span>
                <div className="flex gap-4 mt-2 sm:mt-0">
                  <span>📞 Emergency: +234-800-SMART-CITY</span>
                  <span>📧 support@smartcityalert.com</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
