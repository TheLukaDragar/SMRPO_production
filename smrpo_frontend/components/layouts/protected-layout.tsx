'use client'

import { useUser } from '@/lib/hooks/useUser'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import {AppSidebar} from "@/components/app-sidebar";

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