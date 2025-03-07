'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Project } from '@/lib/types/project-types'
import { getProjects } from '@/lib/actions/project-actions'

interface ProjectContextType {
  activeProject: Project | null
  setActiveProject: (project: Project | null) => void
  projects: Project[]
  loading: boolean
  error: string | null
  refreshProjects: () => Promise<void>
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async () => {
    try {
      const response = await getProjects()
      if ('error' in response) {
        setError(response.error.message)
      } else {
        setProjects(response)
        if (!activeProject && response.length > 0) {
          setActiveProject(response[0])
        }
      }
    } catch (error) {
      setError('Failed to fetch projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  return (
    <ProjectContext.Provider 
      value={{ 
        activeProject, 
        setActiveProject, 
        projects, 
        loading, 
        error,
        refreshProjects: fetchProjects
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider')
  }
  return context
} 