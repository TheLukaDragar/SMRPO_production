import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types/user-types';
import { cache } from 'react';

// Cache the fetch to prevent duplicate requests during render
const getSession = cache(async () => {
  try {
    const response = await fetch('/api/auth/session', {
      // Add proper cache control
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-store',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch session');
    }
    
    return response.json();
  } catch (error) {
    console.error('Session fetch error:', error);
    return null;
  }
});

interface UseUserOptions {
  redirectTo?: string;
  required?: boolean;
}

export function useUser({ 
  redirectTo = '/login', 
  required = true 
}: UseUserOptions = {}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      try {
        const data = await getSession();
        
        if (mounted) {
          if (data?.user) {
            setUser(data.user);
          } else if (required) {
            // Only redirect if authentication is required
            router.push(`${redirectTo}?from=${encodeURIComponent(window.location.pathname)}`);
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        if (mounted && required) {
          router.push(`${redirectTo}?from=${encodeURIComponent(window.location.pathname)}`);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchUser();

    // Cleanup function to prevent memory leaks
    return () => {
      mounted = false;
    };
  }, [router, redirectTo, required]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    mutateUser: async () => {
      setLoading(true);
      const data = await getSession();
      if (data?.user) {
        setUser(data.user);
      }
      setLoading(false);
    }
  };
} 