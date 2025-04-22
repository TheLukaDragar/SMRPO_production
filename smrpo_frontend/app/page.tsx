'use client'

import { useRouter } from 'next/navigation';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { ProtectedLayout } from '@/components/layouts/protected-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard } from "lucide-react";

export default function Home() {
    const router = useRouter();

    const goToDashboard = () => {
        router.push('/dashboard');
    }

    return (
        <ProtectedLayout>
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="#">
                                        Welcome
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Welcome</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-6 p-6">
                    <div className="text-center max-w-3xl mx-auto">
                        <h1 className="text-4xl font-bold mb-4">Welcome to Agile Project Management</h1>
                        <p className="text-lg text-gray-600 mb-8">
                            Your comprehensive solution for managing sprints, backlogs, and project progress.
                            Get started by selecting a project from the dashboard.
                        </p>
                    </div>

                    <div className="max-w-md mx-auto w-full">
                        <Card>
                            <CardHeader>
                                <LayoutDashboard className="h-8 w-8 mb-2 text-blue-600 mx-auto" />
                                <CardTitle className="text-center">Get Started</CardTitle>
                                <CardDescription className="text-center">
                                    Go to the dashboard to select your project and access all features
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <button
                                    onClick={goToDashboard}
                                    className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                                >
                                    Open Dashboard
                                </button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </SidebarInset>
        </ProtectedLayout>
    );
}