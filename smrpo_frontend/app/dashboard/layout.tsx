'use client'

import React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { ProtectedLayout } from "@/components/layouts/protected-layout"
import { useUser } from "@/lib/hooks/useUser"
import { usePathname } from "next/navigation"
import { 
  SidebarInset, 
  SidebarProvider,
  SidebarTrigger 
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useUser()
  const pathname = usePathname()

  if (!user) {
    return null // or loading state
  }

  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean)
    return paths.map((path, index) => {
      const href = '/' + paths.slice(0, index + 1).join('/')
      const isLast = index === paths.length - 1
      
      return (
        <React.Fragment key={path}>
          <BreadcrumbItem className="hidden md:block">
            {isLast ? (
              <BreadcrumbPage>{path.charAt(0).toUpperCase() + path.slice(1)}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink href={href}>
                {path.charAt(0).toUpperCase() + path.slice(1)}
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
          {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
        </React.Fragment>
      )
    })
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
                {getBreadcrumbs()}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </ProtectedLayout>
  );
} 