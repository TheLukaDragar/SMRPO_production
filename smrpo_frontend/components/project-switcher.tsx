"use client"

import * as React from "react"
import { ChevronsUpDown, Plus, Loader2 } from "lucide-react"
import { Project } from "@/lib/types/project-types"
import { getProjects } from "@/lib/actions/project-actions"
import { ProjectFormDialog } from "@/components/project-form-dialog"

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
import { Button } from "@/components/ui/button"

export function ProjectSwitcher() {
  const { isMobile } = useSidebar()
  const [projects, setProjects] = React.useState<Project[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [activeProject, setActiveProject] = React.useState<Project | null>(null)
  const [projectFormOpen, setProjectFormOpen] = React.useState(false)

  React.useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await getProjects()
        if ('error' in response) {
          setError(response.error.message)
        } else {
          setProjects(response)
          setActiveProject(response[0] || null)
        }
      } catch (error) {
        setError('Failed to fetch projects')
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [projectFormOpen]) // Refetch projects when the form dialog closes

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
              <span className="truncate font-medium">Loading projects...</span>
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
          >
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Error: {error}</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (!activeProject) {
    return null
  }

  const handleAddProjectClick = () => {
    // Close the dropdown menu
    document.body.click()
    // Open the project form dialog
    setProjectFormOpen(true)
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
                  {/* Default icon for all projects */}
                  <ChevronsUpDown className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{activeProject.name}</span>
                  <span className="truncate text-xs">{activeProject.description || 'No description'}</span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Projects
              </DropdownMenuLabel>
              {projects.map((project, index) => (
                <DropdownMenuItem
                  key={project._id}
                  onClick={() => setActiveProject(project)}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-xs border">
                    <ChevronsUpDown className="size-4 shrink-0" />
                  </div>
                  {project.name}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="gap-2 p-2 cursor-pointer"
                onClick={handleAddProjectClick}
              >
                <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">Add project</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Project form dialog with external control */}
      <ProjectFormDialog 
        open={projectFormOpen}
        onOpenChange={setProjectFormOpen}
      />
    </>
  )
}
