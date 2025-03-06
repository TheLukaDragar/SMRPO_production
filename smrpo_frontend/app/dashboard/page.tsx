'use client'

import { useEffect, useState } from "react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FilterIcon, MoreVertical, Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { ProjectFormDialog } from "@/components/project-form-dialog"
import { ProjectEditDialog } from "@/components/project-edit-dialog"
import { deleteProject, getProjects } from "@/lib/actions/project-actions"
import { ErrorResponse } from "@/lib/utils/error-handling"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Project } from "@/lib/types/project-types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProtectedLayout } from '@/components/layouts/protected-layout';

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorResponse['error'] | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await getProjects();
        
        if ('error' in response) {
          setError(response.error);
          toast({
            variant: "destructive",
            title: "Error loading projects",
            description: response.error.message,
          });
        } else {
          setProjects(response);
          setError(null);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        setError({
          message: "Failed to fetch projects. Please try again.",
          type: "UnknownError",
          statusCode: 500
        });
        toast({
          variant: "destructive",
          title: "Error loading projects",
          description: "Failed to fetch projects. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [toast]);

  const handleDeleteProject = async (projectId: string) => {
    try {
      const result = await deleteProject(projectId);
      setProjects(projects.filter(p => p._id !== projectId));
      toast({
        variant: "success",
        title: "Project deleted",
        description: "The project has been successfully deleted.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error deleting project",
        description: "Failed to delete project. Please try again.",
      });
    }
  };

  if (loading) {
    return (
      <ProtectedLayout>
        <SidebarInset>
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center py-8">Loading projects...</div>
          </div>
        </SidebarInset>
      </ProtectedLayout>
    );
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
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
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
              <ProjectFormDialog />
              <Button size="sm" variant="outline">
                <FilterIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-6">
            {projects.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg">
                <p className="text-muted-foreground">
                  {error ? 'Unable to load projects' : 'No projects found. Create your first project!'}
                </p>
              </div>
            ) : (
              projects.map(project => (
                <Card key={project._id} className="shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg flex items-center">
                        <span className="h-6 w-6 mr-2 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                          👤
                        </span>
                        {project.name}
                      </CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingProject(project)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => handleDeleteProject(project._id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {project.description}
                      </p>
                    )}
                    {project.boards && project.boards.length > 0 ? (
                      project.boards.map(board => (
                        <div
                          key={board.id}
                          className="bg-slate-100 p-4 rounded-md mb-2 flex justify-between items-center"
                        >
                          <div className="text-sm font-medium">{board.name}</div>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="bg-slate-50 p-4 rounded-md text-center">
                        <p className="text-sm text-muted-foreground">
                          No boards yet. Create your first board!
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </SidebarInset>
      {editingProject && (
        <ProjectEditDialog
          project={editingProject}
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditingProject(null);
          }}
        />
      )}
    </ProtectedLayout>
  );
}
