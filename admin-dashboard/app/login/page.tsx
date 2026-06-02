'use client';

import AuthWrapper from '../providers/AuthWrapper';
import LoginPageContent from '../components/LoginPageContent';

export default function LoginPage() {
  return (
    <AuthWrapper>
      <LoginPageContent />
    </AuthWrapper>
  );
}
