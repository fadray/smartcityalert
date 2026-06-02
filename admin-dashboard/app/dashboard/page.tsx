'use client';

import AuthWrapper from '../providers/AuthWrapper';
import DashboardPageContent from '../components/DashboardPageContent';

export default function DashboardPage() {
  return (
    <AuthWrapper>
      <DashboardPageContent />
    </AuthWrapper>
  );
}
