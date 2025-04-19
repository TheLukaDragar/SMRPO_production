"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/hooks/useUser";

interface SessionCheckProps {
  children: React.ReactNode;
}

export function SessionCheck({ children }: SessionCheckProps) {
  const { user, loading } = useUser();
  const router = useRouter();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // If we're still loading the user, don't do anything yet
    if (loading) return;

    // If there's no user, they'll be redirected by middleware
    if (!user) return;

    // Check if 2FA is enabled for this user
    if (user.twoFactorEnabled) {
      // Make a request to check if 2FA is verified for current session
      const checkTwoFactorVerification = async () => {
        try {
          const response = await fetch("/api/auth/check-2fa-session");
          const data = await response.json();

          if (!data.verified) {
            // Redirect to 2FA verification page
            router.push(`/verify-2fa?from=${encodeURIComponent(window.location.pathname)}&userId=${user._id}`);
          } else {
            // Session is verified, render the page
            setVerified(true);
          }
        } catch (error) {
          console.error("Error checking 2FA session:", error);
          // On error, default to requiring verification
          router.push(`/verify-2fa?from=${encodeURIComponent(window.location.pathname)}&userId=${user._id}`);
        }
      };

      checkTwoFactorVerification();
    } else {
      // No 2FA needed, render the page
      setVerified(true);
    }
  }, [user, loading, router]);

  // Only render children if user exists and verification is complete
  if (!user || (user.twoFactorEnabled && !verified)) {
    return null; // Or a loading indicator
  }

  return <>{children}</>;
} 