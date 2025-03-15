'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProject } from '@/lib/contexts/project-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectRedirectPage() {
  const router = useRouter();
  const { activeProject, loading, error, refreshProjects } = useProject();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (activeProject?._id) {
      console.log('Redirecting to active project:', activeProject._id);
      router.push(`/dashboard/project/${activeProject._id}`);
    }
  }, [activeProject, router]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshProjects();
    setIsRefreshing(false);
  };

  const handleCreateProject = () => {
    // Navigate to the dashboard where the user can create a project
    router.push('/dashboard');
  };

  if (loading || isRefreshing) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-4 w-[350px]" />
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Projects</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <button 
            onClick={handleRefresh}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh Projects'}
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!activeProject) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Project Selected</CardTitle>
          <CardDescription>
            You don't have any active projects. Please create a project or select one from the project switcher.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <button 
            onClick={handleCreateProject}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
          >
            Create Project
          </button>
          <button 
            onClick={handleRefresh}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md text-sm font-medium"
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh Projects'}
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-[250px]" />
      <Skeleton className="h-4 w-[350px]" />
      <p className="text-muted-foreground">Redirecting to project details...</p>
    </div>
  );
} 