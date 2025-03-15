'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FilterIcon, MoreVertical, Pencil, Trash2, PlusIcon } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { ProjectFormDialog } from "@/components/project-form-dialog"
import { ProjectEditDialog } from "@/components/project-edit-dialog"
import { deleteProject } from "@/lib/actions/project-actions"
import { ErrorResponse } from "@/lib/utils/error-handling"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Project } from "@/lib/types/project-types"
import { useUser } from "@/lib/hooks/useUser"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useProject } from '@/lib/contexts/project-context';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useUser();
  const { activeProject, projects, loading, error: contextError, refreshProjects } = useProject();
  const [error, setError] = useState<ErrorResponse['error'] | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(user?.role === "Administrator");
  }, [user]);

  useEffect(() => {
    // Open project form dialog if create=true is in URL and user is admin
    if (searchParams.get('create') === 'true' && isAdmin) {
      setProjectFormOpen(true);
    }
  }, [searchParams, isAdmin]);

  useEffect(() => {
    if (contextError) {
      setError({
        message: contextError,
        type: "UnknownError",
        statusCode: 500
      });
    }
  }, [contextError]);

  const handleProjectFormOpenChange = (open: boolean) => {
    setProjectFormOpen(open);
    if (!open) {
      // Remove the create parameter from URL when dialog is closed
      const url = new URL(window.location.href);
      url.searchParams.delete('create');
      router.replace(url.pathname);
      refreshProjects();
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!isAdmin) {
      toast({
        variant: "destructive",
        title: "Permission denied",
        description: "Only administrators can delete projects.",
      });
      return;
    }

    try {
      await deleteProject(projectId);
      await refreshProjects();
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
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center py-8">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="container max-w-screen-lg mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold">
            {isAdmin ? "All Projects" : "My Projects"}
          </h1>
          <div className="flex gap-2">
            {isAdmin && (
              <ProjectFormDialog 
                open={projectFormOpen}
                onOpenChange={handleProjectFormOpenChange}
                trigger={
                  <Button size="sm" variant="outline">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Project
                  </Button>
                }
              />
            )}
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
                {error ? 'Unable to load projects' : isAdmin ? 'No projects yet, let\'s create one!' : 'You are not assigned to any projects yet. Contact your administrator.'}
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
                    {isAdmin && (
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
                    )}
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
      {editingProject && (
        <ProjectEditDialog
          project={editingProject}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setEditingProject(null);
              refreshProjects();
            }
          }}
        />
      )}
    </div>
  );
}
