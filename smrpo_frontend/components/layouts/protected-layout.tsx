'use client'

import { useUser } from '@/lib/hooks/useUser'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'

interface ProtectedLayoutProps {
    children: React.ReactNode
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
    const { user, loading } = useUser()

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <Progress />
            </div>
        )
    }

    if (!user) {
        return null // The useUser hook will handle redirection
    }

    return (
        <SidebarProvider>
            <AppSidebar user={user} />
            {children}
        </SidebarProvider>
    )
}

interface AppSidebarProps {
    user: any // Adjust the type if you have a specific user type
}

export function AppSidebar({ user }: AppSidebarProps) {
    return (
        <aside className="sidebar p-4">
            <nav>
                <ul className="space-y-2">
                    {/* Existing navigation items */}
                    <li>
                        <Link href="/dashboard" className="hover:underline">
                            Dashboard
                        </Link>
                    </li>
                    {/* New profile link */}
                    <li>
                        <Link href="/profile" className="hover:underline">
                            Profile
                        </Link>
                    </li>
                </ul>
            </nav>
        </aside>
    )
}