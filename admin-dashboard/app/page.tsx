'use client';

import AuthWrapper from './providers/AuthWrapper';
import HomePageContent from './components/HomePageContent';

export default function Home() {
  return (
    <AuthWrapper>
      <HomePageContent />
    </AuthWrapper>
  );
}
