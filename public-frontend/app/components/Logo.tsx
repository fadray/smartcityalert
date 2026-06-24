import Link from 'next/link';
import Image from 'next/image';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 group">
      <div className="relative">
        {/* ✅ Custom Logo Image */}
        <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow duration-300 bg-white flex items-center justify-center">
          <Image
            src="/images/logo.png"
            alt="SmartCityAlert Logo"
            width={48}
            height={48}
            className="object-contain"
            priority
          />
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold tracking-tight text-white group-hover:text-blue-200 transition-colors">
          SmartCityAlert
        </span>
        <span className="text-[10px] font-light text-blue-300 tracking-wider uppercase">The Redemption City</span>
      </div>
    </Link>
  );
}
