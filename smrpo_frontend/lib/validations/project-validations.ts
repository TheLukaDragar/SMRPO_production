import { z } from 'zod';
import { ProjectRole } from '../types/project-types';

// Validation schema for BoardColumn
export const BoardColumnSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Column name is required').max(50, 'Column name cannot exceed 50 characters'),
    order: z.number().int().min(0)
});

// Validation schema for Board
export const BoardSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Board name is required').max(50, 'Board name cannot exceed 50 characters'),
    description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
    columns: z.array(BoardColumnSchema)
});

// Validation schema for ProjectMember
export const ProjectMemberSchema = z.object({
    userId: z.string(),
    role: z.nativeEnum(ProjectRole),
    joinedAt: z.date()
});

// Validation schema for Project
export const ProjectSchema = z.object({
    _id: z.string(),
    name: z.string()
        .min(1, 'Project name is required')
        .max(100, 'Project name cannot exceed 100 characters'),
    description: z.string()
        .max(1000, 'Description cannot exceed 1000 characters')
        .optional(),
    createdAt: z.date(),
    boards: z.array(BoardSchema),
    members: z.array(ProjectMemberSchema)
        .min(1, 'Project must have at least one member')
});

// Validation schema for project creation
export const CreateProjectSchema = ProjectSchema.omit({ 
    _id: true,
    createdAt: true 
});

// Validation schema for project update
export const UpdateProjectSchema = ProjectSchema.partial().omit({ 
    _id: true,
    createdAt: true 
});

// Validation schema for adding a project member
export const AddProjectMemberSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    role: z.nativeEnum(ProjectRole)
});

// Helper function to validate project data
export function validateProject(data: unknown) {
    return ProjectSchema.parse(data);
}

// Helper function to validate project creation data
export function validateCreateProject(data: unknown) {
    return CreateProjectSchema.parse(data);
}

// Helper function to validate project update data
export function validateUpdateProject(data: unknown) {
    return UpdateProjectSchema.parse(data);
}

// Helper function to validate project member data
export function validateAddProjectMember(data: unknown) {
    return AddProjectMemberSchema.parse(data);
} 