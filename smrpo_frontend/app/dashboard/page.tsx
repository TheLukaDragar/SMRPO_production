'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  FilterIcon, MoreVertical, Pencil, Trash2, PlusIcon,
  UserX, UserPlus, Users, Calendar, Clock, Layers, 
  Activity, AlertCircle, ArrowRight, Loader2, 
  User
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { ProjectFormDialog } from "@/components/project-form-dialog"
import { ProjectEditDialog } from "@/components/project-edit-dialog"
import { deleteProject } from "@/lib/actions/project-actions"
import { ErrorResponse } from "@/lib/utils/error-handling"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Project, ProjectRole } from "@/lib/types/project-types"
import { useUser } from "@/lib/hooks/useUser"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useProject } from '@/lib/contexts/project-context'
import { leaveProject, becomeProductOwner } from "@/lib/actions/project-actions"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { motion } from "framer-motion"
import { format } from "date-fns"

function getInitials(name: string): string {
  if (!name) return "P";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getProjectColor(id: string): string {
  // Generate a consistent color based on project ID
  const colors = [
    "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-amber-500", 
    "bg-pink-500", "bg-indigo-500", "bg-red-500", "bg-cyan-500",
    "bg-emerald-500", "bg-fuchsia-500", "bg-rose-500", "bg-violet-500"
  ];
  
  // Use the sum of character codes to pick a color
  const sum = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[sum % colors.length];
}

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
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

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

  const handleLeaveProject = async (projectId: string) => {
    if (!user || !user._id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to leave a project.",
      });
      return;
    }

    try {
      const response = await leaveProject(projectId, user._id);
      if ('success' in response && response.success) {
        toast({
          variant: "success",
          title: "Left Project",
          description: "You have successfully left the project.",
        });
        refreshProjects();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: 'error' in response ? response.error.message : "An unknown error occurred.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not leave the project. Please try again.",
      });
    }
  };

  const handleBecomeProductOwner = async (projectId: string) => {
    if (!user || !user._id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to take this role.",
      });
      return;
    }

    try {
      const response = await becomeProductOwner(projectId, user._id);

      if (response.success) {
        toast({
          variant: "success",
          title: "Role Updated",
          description: "You are now the Product Owner and a project member.",
        });
        refreshProjects();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error || "An unknown error occurred.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update role. Please try again.",
      });
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

    //confirm dialouge 
    const confirm = window.confirm("Are you sure you want to delete this project? This action cannot be undone.");
    if (!confirm) {
      return;
    }

    setDeletingProjectId(projectId);

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
    } finally {
      setDeletingProjectId(null);
    }
  };

  // Navigate to project
  const handleNavigateToProject = (projectId: string) => {
    router.push(`/dashboard/project/${projectId}`);
  };

  // Render loading skeleton
  if (loading) {
    return (
      <div className="flex-1 overflow-auto bg-slate-50/50">
        <div className="container max-w-screen-lg mx-auto p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="h-8 w-32 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-8 w-24 bg-slate-200 rounded animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="flex justify-between items-center mb-4">
                  <div className="h-6 w-40 bg-slate-200 rounded"></div>
                  <div className="h-6 w-6 bg-slate-200 rounded-full"></div>
                </div>
                <div className="h-4 w-full bg-slate-200 rounded mb-3"></div>
                <div className="h-4 w-2/3 bg-slate-200 rounded mb-6"></div>
                <div className="flex justify-between items-center">
                  <div className="h-8 w-24 bg-slate-200 rounded"></div>
                  <div className="h-5 w-16 bg-slate-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasProjects = projects && projects.length > 0;

  return (
    <div className="flex-1 overflow-auto bg-slate-50/50">
      <div className="container max-w-screen-lg mx-auto p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              {isAdmin ? "All Projects" : "My Projects"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isAdmin 
                ? "Manage and monitor all projects in the system" 
                : "View and access your assigned projects"}
            </p>
          </div>
          <div className="flex gap-2 md:self-start">
            {isAdmin && (
              <ProjectFormDialog
                open={projectFormOpen}
                onOpenChange={handleProjectFormOpenChange}
                trigger={
                  <Button size="sm">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    New Project
                  </Button>
                }
              />
            )}
            <Button size="sm" variant="outline">
              <FilterIcon className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        {!hasProjects ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center bg-white rounded-lg shadow-sm p-12 text-center"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              {error 
                ? <AlertCircle className="h-8 w-8 text-primary" />
                : <Layers className="h-8 w-8 text-primary" />}
            </div>
            <h3 className="text-xl font-medium mb-2">
              {error ? 'Unable to load projects' : isAdmin ? 'No projects yet' : 'No assigned projects'}
            </h3>
            <p className="text-muted-foreground max-w-md mb-6">
              {error 
                ? 'We encountered an error loading your projects. Please try again later.' 
                : isAdmin 
                  ? 'Get started by creating your first project with the "New Project" button above.' 
                  : 'You are not assigned to any projects yet. Please contact your administrator.'}
            </p>
            {isAdmin && !error && (
              <Button onClick={() => setProjectFormOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project, index) => {
              const colorClass = getProjectColor(project._id);
              const memberCount = project.members?.length || 0;
              const productOwner = project.members?.find(m => m.role === ProjectRole.PRODUCT_OWNER);
              const isUserMember = user && project.members?.some(m => m.userId === user._id);
              
              // Format created date if available
              const createdDate = project.createdAt 
                ? format(new Date(project.createdAt), 'MMM d, yyyy')
                : 'Unknown date';
              
              return (
                <motion.div
                  key={project._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden h-full flex flex-col relative">
                    {/* Colored accent bar */}
                    <div className={`h-1.5 w-full ${colorClass} absolute top-0 left-0`}></div>
                    
                    <CardHeader className="pb-3 pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <Avatar className={`${colorClass} h-10 w-10`}>
                            <AvatarFallback>{getInitials(project.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg hover:text-primary cursor-pointer" onClick={() => handleNavigateToProject(project._id)}>
                              {project.name}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              Created {createdDate}
                            </CardDescription>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* Admin-Only Options */}
                            {isAdmin && (
                              <>
                                <DropdownMenuItem onClick={() => router.push(`/dashboard/project/${project._id}/settings`)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => handleDeleteProject(project._id)}
                                  disabled={deletingProjectId === project._id}
                                >
                                  {deletingProjectId === project._id ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 mr-2" />
                                  )}
                                  Delete
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}

                            {/* Show "Become Product Owner" if no current Product Owner */}
                            {project.members && !project.members.some(m => m.role === "PRODUCT_OWNER") && (
                              <>
                                <DropdownMenuItem onClick={() => handleBecomeProductOwner(project._id)}>
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Become Product Owner
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}

                            {/* Show "Leave Project" only if the user is a project member */}
                            {isUserMember && (
                              <DropdownMenuItem onClick={() => handleLeaveProject(project._id)}>
                                <UserX className="h-4 w-4 mr-2" />
                                Leave Project
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="flex-1">
                      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                        {project.description || "No description provided."}
                      </p>
                      
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
                        </Badge>
                        
                        {project.estimated_time > 0 && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{project.estimated_time}h</span>
                          </Badge>
                        )}
                        
                        {isUserMember && (
                          <Badge variant="outline" className="border-green-500 text-green-600">
                            Member
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                    
                    <CardFooter className="flex justify-between pt-2 pb-4">
                      <div className="flex -space-x-2">
                        {project.members?.slice(0, 5).map((member, idx) => (
                          <Avatar key={member.userId} className="border-2 border-background h-8 w-8">
                            <AvatarFallback className={`text-xs ${
                              member.role === 'PRODUCT_OWNER' ? 'bg-blue-300' :
                              member.role === 'SCRUM_MASTER' ? 'bg-purple-300' :
                              member.role === 'DEVELOPER' ? 'bg-green-300' :
                              member.role === 'SCRUM_DEV' ? 'bg-red-300' :
                              'bg-slate-300'
                            }`}>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {memberCount > 5 && (
                          <Avatar className="border-2 border-background h-8 w-8">
                            <AvatarFallback className="text-xs bg-slate-300">
                              +{memberCount - 5}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => handleNavigateToProject(project._id)}
                      >
                        <span>View</span>
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
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
