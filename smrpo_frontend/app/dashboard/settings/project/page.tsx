'use client'

import { useProject } from "@/lib/contexts/project-context"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"

export default function ProjectSettingsPage() {
  const { activeProject } = useProject()

  if (!activeProject) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center py-8">No project selected</div>
      </div>
    )
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center border-b">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/settings">Settings</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Project Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex-1 overflow-auto">
        <div className="container max-w-screen-lg mx-auto p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-semibold">Project Settings</h1>
          </div>
          <div className="grid gap-6">
            <div className="rounded-lg border p-6">
              <h2 className="text-lg font-medium mb-4">Project Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Project Name</label>
                  <p className="text-sm text-muted-foreground mt-1">{activeProject.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activeProject.description || 'No description'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 