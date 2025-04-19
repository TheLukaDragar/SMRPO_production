import React, { Suspense } from 'react';
import VerifyTwoFactorClientContent from './VerifyTwoFactorClientContent'; // Adjust path if necessary

// Define a simple fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Loading...</p> 
      {/* You can replace this with a more sophisticated spinner or skeleton loader */}
    </div>
  );
}

// This is now a Server Component (or can be)
export default function VerifyTwoFactorPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyTwoFactorClientContent />
    </Suspense>
  );
} 