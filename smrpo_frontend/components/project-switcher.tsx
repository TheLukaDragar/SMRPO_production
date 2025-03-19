"use client"

import * as React from "react"
import { ChevronsUpDown, Plus, Loader2, Info, BookDashed } from "lucide-react"
import { Project } from "@/lib/types/project-types"
import { useProject } from "@/lib/contexts/project-context"
import { useRouter, usePathname } from "next/navigation"
import { useUser } from "@/lib/hooks/useUser"
import { useEffect } from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function ProjectSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const { isMobile } = useSidebar()
  const { user } = useUser()
  const { activeProject, setActiveProject, projects, loading, error, refreshProjects } = useProject()
  const isAdmin = user?.role === "Administrator"

  // Sync active project with URL on mount and pathname changes
  useEffect(() => {
    if (loading || !projects.length) return;

    // Extract project ID from URL if we're in a project route
    const projectIdMatch = pathname.match(/\/project\/([^/]+)/);
    if (projectIdMatch) {
      const urlProjectId = projectIdMatch[1];
      const projectFromUrl = projects.find(p => p._id === urlProjectId);
      
      // Only update if we found a matching project and it's different from current
      if (projectFromUrl && (!activeProject || activeProject._id !== urlProjectId)) {
        console.log('Syncing active project with URL:', urlProjectId);
        setActiveProject(projectFromUrl);
      }
    }
  }, [pathname, projects, loading, activeProject, setActiveProject]);

  const handleProjectSelect = (project: Project) => {
    console.log('Selecting project:', project._id);
    setActiveProject(project);

    // Get the current path segments
    const pathSegments = pathname.split('/')
    
    // Check if we're in a project-specific route
    if (pathname.includes('/project/')) {
      // Replace or add the project ID in the path
      const newPath = pathname.replace(/\/project\/[^/]+/, `/project/${project._id}`);
      router.push(newPath);
    } else {
      // If not in a project-specific route, go to project overview
      router.push(`/dashboard/project/${project._id}`);
    }
  }

  const handleViewProjectDetails = () => {
    // Close the dropdown menu
    document.body.click();
    // Navigate to project details page with the active project ID
    if (activeProject?._id) {
      console.log('Viewing project details for:', activeProject._id);
      router.push(`/dashboard/project/${activeProject._id}`);
    } else {
      console.log('No active project, redirecting to project page');
      router.push('/dashboard/project');
    }
  }

  const handleAddProjectClick = () => {
    console.log('Adding project');
    // Close the dropdown menu
    document.body.click()
    // Redirect to dashboard with create=true parameter
    router.push('/dashboard?create=true')
  }

  if (loading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <Loader2 className="size-4 animate-spin" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Loading workspace...</span>
              <span className="truncate text-xs text-muted-foreground">Please wait</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (error) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="text-destructive"
            onClick={() => refreshProjects()}
          >
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Error loading projects</span>
              <span className="truncate text-xs">Click to retry</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (!activeProject) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            onClick={isAdmin ? handleAddProjectClick : undefined}
            className={!isAdmin ? "cursor-not-allowed opacity-70" : ""}
          >
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              {isAdmin ? <Plus className="size-4" /> : <BookDashed className="size-4" />}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                {isAdmin ? "Create Project" : "No projects yet"}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {isAdmin ? "Start a new project" : "Contact administrator"}
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <ChevronsUpDown className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{activeProject.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {activeProject.description || 'Current workspace'}
                  </span>
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                {isAdmin ? "All Projects" : "My Projects"}
              </DropdownMenuLabel>
              {projects.map((project, index) => (
                <DropdownMenuItem
                  key={project._id}
                  onClick={() => handleProjectSelect(project)}
                  className="gap-2 p-2"
                >
                  <div className="flex-1 truncate">
                    {project.name}
                    {project.description && (
                      <span className="block text-xs text-muted-foreground truncate">
                        {project.description}
                      </span>
                    )}
                    {project.estimated_time !== undefined && project.estimated_time !== 0 && (
                      <span className="block text-xs font-medium text-gray-700">
                        Estimated Time: {project.estimated_time} hours
                      </span>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 p-2 cursor-pointer"
                onClick={handleViewProjectDetails}
              >
                <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                  <Info className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">Project details</div>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem
                  className="gap-2 p-2 cursor-pointer"
                  onClick={handleAddProjectClick}
                >
                  <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                    <Plus className="size-4" />
                  </div>
                  <div className="text-muted-foreground font-medium">Create new project</div>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  )
}
