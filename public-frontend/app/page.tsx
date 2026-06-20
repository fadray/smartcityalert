import Link from 'next/link'

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center py-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">Welcome to SmartCityAlert</h1>
        <p className="text-xl text-gray-600 mb-8">Report incidents in your community and track their resolution</p>
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <Link href="/report">
            <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition cursor-pointer">
              <div className="text-4xl mb-4">📢</div>
              <h2 className="text-2xl font-bold text-gray-900">Report an Incident</h2>
              <p className="text-gray-600 mt-2">Report fire, medical emergencies, security issues, and more</p>
            </div>
          </Link>
          <Link href="/status">
            <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition cursor-pointer">
              <div className="text-4xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold text-gray-900">Track an Incident</h2>
              <p className="text-gray-600 mt-2">Check the status of your reported incident using the ID</p>
            </div>
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
          <div className="bg-white p-4 rounded-lg shadow"><div className="text-2xl">🔥</div><p>Fire Emergency</p></div>
          <div className="bg-white p-4 rounded-lg shadow"><div className="text-2xl">🚑</div><p>Medical Help</p></div>
          <div className="bg-white p-4 rounded-lg shadow"><div className="text-2xl">👮</div><p>Security</p></div>
          <div className="bg-white p-4 rounded-lg shadow"><div className="text-2xl">🔧</div><p>Infrastructure</p></div>
        </div>
      </div>
    </div>
  )
}
