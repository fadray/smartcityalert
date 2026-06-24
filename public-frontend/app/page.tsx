import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 rounded-2xl overflow-hidden shadow-2xl mb-12">
        <div className="absolute inset-0 bg-grid-white/10 bg-grid-16"></div>
        <div className="relative px-6 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs text-white/80 font-medium">24/7 Emergency Response</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
            Keeping{' '}
            <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
              The Redemption City
            </span>{' '}
            Safe
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            Report incidents instantly and track their resolution in real-time. 
            Together, we build a safer community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/report" 
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-blue-700 rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <span>🚀</span> Report Incident
            </Link>
            <Link 
              href="/status" 
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-500/30 backdrop-blur-sm text-white rounded-xl font-semibold border border-white/20 hover:bg-blue-500/40 transition-all duration-300"
            >
              <span>🔍</span> Track Incident
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { icon: '🚨', label: 'Active Incidents', value: '12' },
          { icon: '✅', label: 'Resolved Today', value: '47' },
          { icon: '🚑', label: 'Responders Online', value: '24' },
          { icon: '⏱️', label: 'Avg Response Time', value: '4.2 min' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-5 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-3xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Incident Types */}
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Report by Incident Type</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { icon: '🔥', label: 'Fire Emergency', color: 'from-red-500 to-red-600' },
          { icon: '🚑', label: 'Medical Help', color: 'from-green-500 to-green-600' },
          { icon: '👮', label: 'Security', color: 'from-blue-500 to-blue-600' },
          { icon: '🔧', label: 'Infrastructure', color: 'from-orange-500 to-orange-600' },
        ].map((type, i) => (
          <Link key={i} href="/report">
            <div className={`bg-gradient-to-br ${type.color} rounded-xl p-6 text-center text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer`}>
              <div className="text-4xl mb-2">{type.icon}</div>
              <div className="font-semibold text-sm">{type.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* About Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
            🏙️
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Proudly Built for The Redemption City</h3>
            <p className="text-gray-600 leading-relaxed">
              SmartCityAlert is a community-driven platform designed to enhance public safety 
              and infrastructure monitoring in The Redemption City. Our mission is to provide 
              a swift, transparent, and efficient incident reporting and resolution system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
