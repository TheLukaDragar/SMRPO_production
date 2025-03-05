'use client'

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Card , CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { PlusIcon, FilterIcon, MoreVertical } from "lucide-react"
import { useRouter } from "next/navigation"

// Mock project data
const projects = [
  {
    id: 1,
    name: "SMRPO 7 - 2025",
    boards: [
      {
        id: 1,
        name: "Tabla - Orodje za podporo metodi Scrum - SMRPO 7",
      }
    ]
  },
  {
    id: 2,
    name: "Vaje SMRPO 2024/25",
    boards: [
      {
        id: 2,
        name: "Testna tabla za SMRPO 2024/25",
      }
    ]
  }
]

export default function DashboardPage() {
  const router = useRouter();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>My Projects</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6 pt-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">My workspaces</h1>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <PlusIcon className="h-4 w-4 mr-1" />
                Add
              </Button>
              <Button size="sm" variant="outline">
                <FilterIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid gap-6">
            {projects.map(project => (
              <Card key={project.id} className="shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center">
                      <span className="h-6 w-6 mr-2 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                        👤
                      </span>
                      {project.name}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {project.boards.map(board => (
                    <div key={board.id} className="bg-slate-100 p-4 rounded-md mb-2 flex justify-between items-center">
                      <div className="text-sm font-medium">{board.name}</div>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
