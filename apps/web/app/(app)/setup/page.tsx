'use client';

import { OnboardingPageContent } from '../instructor/onboarding/onboarding-page-content';

export default function SetupPage() {
  return <OnboardingPageContent defaultViewMode="student" basePath="/setup" />;
}
