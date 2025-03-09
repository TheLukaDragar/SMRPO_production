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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{projectDetails.name}</h1>
        <p className="text-muted-foreground">
          {projectDetails.description || 'No description provided'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Project ID: {projectDetails._id}
        </p>
      </div>
      <Separator />
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="boards">Boards</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>
                Basic information about the project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <div className="font-medium">Created</div>
                <div className="text-sm text-muted-foreground">
                  {projectDetails.createdAt ? formatDate(new Date(projectDetails.createdAt)) : 'Unknown'}
                </div>
              </div>
              <div>
                <div className="font-medium">Team Size</div>
                <div className="text-sm text-muted-foreground">
                  {projectDetails.members?.length || 0} members
                </div>
              </div>
              <div>
                <div className="font-medium">Boards</div>
                <div className="text-sm text-muted-foreground">
                  {projectDetails.boards?.length || 0} boards
                </div>
              </div>
            </CardContent>
          </Card>
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
                  <div key={index} className="flex items-center justify-between">
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
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>{board.name}</CardTitle>
                      <CardDescription>
                        {board.columns.length} columns
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        {board.columns.map((column, colIndex) => (
                          <Badge key={colIndex} variant="outline">
                            {column.name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!projectDetails.boards || projectDetails.boards.length === 0) && (
                  <div className="text-muted-foreground">No boards found</div>
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
      <div>
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-4 w-[350px] mt-2" />
      </div>
      <Separator />
      <div className="space-y-4">
        <Skeleton className="h-10 w-[300px]" />
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-[150px]" />
            <Skeleton className="h-4 w-[250px] mt-1" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
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