'use client';

import { useEffect, useState } from 'react';
import { useProject } from '@/lib/contexts/project-context';
import { getProjectById } from '@/lib/actions/project-actions';
import { Project, ProjectRole } from '@/lib/types/project-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { activeProject, setActiveProject, projects } = useProject();
  const [projectDetails, setProjectDetails] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Try to find the project in the existing projects list first
  useEffect(() => {
    if (projects.length > 0 && projectId) {
      const foundProject = projects.find(p => p._id === projectId);
      if (foundProject) {
        setProjectDetails(foundProject);
        setActiveProject(foundProject);
        setLoading(false);
        return;
      }
    }
    
    // If not found in the list or list is empty, fetch from API
    async function fetchProjectDetails() {
      if (!projectId) {
        setLoading(false);
        setError('No project ID provided');
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching project with ID:', projectId);
        
        const response = await getProjectById(projectId);
        console.log('Project API response:', response);
        
        if (response === null) {
          setError('Project not found');
        } else if ('error' in response) {
          console.error('Error from API:', response.error);
          setError(response.error.message);
        } else {
          console.log('Project details received:', response);
          setProjectDetails(response);
          // Update the active project in the context
          setActiveProject(response);
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project details');
      } finally {
        setLoading(false);
      }
    }

    fetchProjectDetails();
  }, [projectId, setActiveProject, projects]);

  // If we have an active project but it doesn't match the URL, update it
  useEffect(() => {
    if (activeProject && projectId && activeProject._id !== projectId) {
      const foundProject = projects.find(p => p._id === projectId);
      if (foundProject) {
        setActiveProject(foundProject);
      }
    }
  }, [activeProject, projectId, projects, setActiveProject]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    // Force a refresh by changing the URL slightly and then back
    router.push('/dashboard/project');
    setTimeout(() => {
      router.push(`/dashboard/project/${projectId}`);
    }, 100);
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Project ID: {projectId}
          </p>
          <button 
            onClick={handleRetry}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
          >
            Retry
          </button>
          <button 
            onClick={() => router.push('/dashboard/project')}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md text-sm font-medium ml-2"
          >
            Go Back
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!projectDetails) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Project Found</CardTitle>
          <CardDescription>
            The requested project could not be found.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Project ID: {projectId}
          </p>
          <button 
            onClick={handleRetry}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
          >
            Retry
          </button>
          <button 
            onClick={() => router.push('/dashboard/project')}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md text-sm font-medium ml-2"
          >
            Go Back
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h1 className="text-3xl font-bold tracking-tight">{projectDetails.name}</h1>
        <div className="mt-2 flex items-center gap-2 text-muted-foreground text-sm">
          <span>Created {projectDetails.createdAt ? formatDate(new Date(projectDetails.createdAt)) : 'Unknown'}</span>
          <span>•</span>
          <span>ID: {projectDetails._id}</span>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-white border shadow-sm">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="boards">Boards</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  {projectDetails.description ? (
                    <p className="whitespace-pre-line">{projectDetails.description}</p>
                  ) : (
                    <p className="text-muted-foreground italic">No description provided</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Team Size</div>
                    <div className="text-2xl font-bold">{projectDetails.members?.length || 0}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Boards</div>
                    <div className="text-2xl font-bold">{projectDetails.boards?.length || 0}</div>
                  </div>
                </div>
                
                {projectDetails.estimated_time && (
                  <div className="pt-2">
                    <div className="text-sm font-medium text-muted-foreground">Estimated Time</div>
                    <div className="text-lg font-medium">{projectDetails.estimated_time} hours</div>
                  </div>
                )}
                
                <div className="pt-2">
                  <div className="text-sm font-medium text-muted-foreground">Created</div>
                  <div className="text-base">
                    {projectDetails.createdAt ? formatDate(new Date(projectDetails.createdAt)) : 'Unknown'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                People working on this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectDetails.members?.map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors">
                    <div>
                      <div className="font-medium">{member.userId}</div>
                      <div className="text-sm text-muted-foreground">
                        Joined {member.joinedAt ? formatDate(new Date(member.joinedAt)) : 'Unknown'}
                      </div>
                    </div>
                    <Badge variant={getRoleBadgeVariant(member.role)}>
                      {member.role}
                    </Badge>
                  </div>
                ))}
                {(!projectDetails.members || projectDetails.members.length === 0) && (
                  <div className="text-muted-foreground">No team members found</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="boards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Boards</CardTitle>
              <CardDescription>
                Manage your project boards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectDetails.boards?.map((board, index) => (
                  <Card key={index} className="hover:bg-card/95 hover:shadow-sm transition-all">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{board.name}</CardTitle>
                      <CardDescription>
                        {board.columns.length} {board.columns.length === 1 ? 'column' : 'columns'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {board.columns.map((column, colIndex) => (
                          <Badge key={colIndex} variant="outline" className="px-3 py-1">
                            {column.name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!projectDetails.boards || projectDetails.boards.length === 0) && (
                  <div className="text-center py-8 bg-muted/20 rounded-md border border-dashed">
                    <p className="text-muted-foreground">No boards found</p>
                    <p className="text-xs text-muted-foreground mt-1">Create a board to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <Skeleton className="h-8 w-[250px]" />
        <div className="mt-2 flex items-center gap-2">
          <Skeleton className="h-4 w-[180px]" />
        </div>
      </div>
      
      <div className="space-y-4">
        <Skeleton className="h-10 w-[300px]" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-[120px]" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[70%]" />
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-[150px]" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-[70px]" />
                  <Skeleton className="h-7 w-[40px]" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-[70px]" />
                  <Skeleton className="h-7 w-[40px]" />
                </div>
              </div>
              
              <div className="pt-2">
                <Skeleton className="h-3 w-[100px]" />
                <Skeleton className="h-5 w-[150px] mt-1" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getRoleBadgeVariant(role: ProjectRole) {
  switch (role) {
    case ProjectRole.PRODUCT_OWNER:
      return 'default';
    case ProjectRole.SCRUM_MASTER:
      return 'secondary';
    case ProjectRole.DEVELOPER:
      return 'outline';
    default:
      return 'outline';
  }
} 