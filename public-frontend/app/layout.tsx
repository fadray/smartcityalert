import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';  // ✅ Add this import
import Logo from './components/Logo';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SmartCityAlert - The Redemption City',
  description: 'Report and track incidents in The Redemption City community',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          {/* Premium Header */}
          <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 shadow-xl border-b border-blue-700/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-20">
                <Logo />
                <nav className="hidden md:flex items-center gap-8">
                  <Link 
                    href="/" 
                    className="text-blue-200 hover:text-white transition-colors font-medium text-sm tracking-wide"
                  >
                    Home
                  </Link>
                  <Link 
                    href="/report" 
                    className="text-blue-200 hover:text-white transition-colors font-medium text-sm tracking-wide"
                  >
                    Report Incident
                  </Link>
                  <Link 
                    href="/status" 
                    className="text-blue-200 hover:text-white transition-colors font-medium text-sm tracking-wide"
                  >
                    Track Status
                  </Link>
                  <Link 
                    href="/about" 
                    className="text-blue-200 hover:text-white transition-colors font-medium text-sm tracking-wide"
                  >
                    About
                  </Link>
                </nav>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-blue-700/50 rounded-full border border-blue-600/30">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs text-blue-300 font-medium">24/7 Active</span>
                  </div>
                  <span className="text-xs text-blue-400 hidden lg:block">📞 Emergency: +234-800-SMART-CITY</span>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-grow bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>

          {/* Premium Footer */}
          <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-t border-gray-700/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <span className="text-white font-bold text-sm">SmartCityAlert</span>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Building a smarter, safer community for The Redemption City. 
                    Report incidents and track their resolution in real-time.
                  </p>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm mb-3">Quick Links</h4>
                  <ul className="space-y-2 text-sm">
                    <li><Link href="/report" className="text-gray-400 hover:text-white transition-colors">Report Incident</Link></li>
                    <li><Link href="/status" className="text-gray-400 hover:text-white transition-colors">Track Status</Link></li>
                    <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm mb-3">Contact</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-center gap-2">
                      <span>📞</span> +234-800-SMART-CITY
                    </li>
                    <li className="flex items-center gap-2">
                      <span>📧</span> support@smartcityalert.com
                    </li>
                    <li className="flex items-center gap-2">
                      <span>📍</span> The Redemption City
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-gray-700/50 flex flex-col sm:flex-row justify-between items-center gap-3">
                <p className="text-xs text-gray-500">
                  © 2026 SmartCityAlert. Proudly Built for The Redemption City.
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
                  <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms of Service</Link>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    All Systems Operational
                  </span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
