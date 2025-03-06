import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types/user-types';

export function useUser(redirectTo: string = '/login') {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch('/api/auth/session');
                if (response.ok) {
                    const data = await response.json();
                    if (data.user) {
                        setUser(data.user);
                    } else {
                        router.push(redirectTo);
                    }
                } else {
                    router.push(redirectTo);
                }
            } catch (error) {
                console.error('Error fetching user:', error);
                router.push(redirectTo);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [router, redirectTo]);

    return { user, loading };
} 