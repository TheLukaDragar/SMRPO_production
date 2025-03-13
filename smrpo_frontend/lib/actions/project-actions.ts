'use server';

import { connectToDatabase } from "@/lib/db/connection";
import { revalidatePath } from 'next/cache';
import { validateCreateProject, validateUpdateProject, validateAddProjectMember } from '../validations/project-validations';
import { ZodError } from 'zod';
import { AppError, createErrorResponse, ErrorResponse } from '../utils/error-handling';
import { Project, ProjectRole } from '../types/project-types';
import { getSession } from '@/lib/auth/session';
import { ObjectId } from 'mongodb';

// Get all projects
export async function getProjects(): Promise<Project[] | ErrorResponse> {
    try {
        const { db } = await connectToDatabase();
        const projects = await db().collection('projects').find({}).toArray();
        console.log(projects);
        return JSON.parse(JSON.stringify(projects));
    } catch (error) {
        return createErrorResponse(error);
    }
}

// Handle project form submission
export async function handleAddProject(formData: FormData): Promise<ErrorResponse | { success: true }> {
    try {
        // Get the authenticated user's session
        const session = await getSession();
        if (!session?.user?._id) {
            return createErrorResponse(new AppError('User not authenticated', 401, 'AuthError'));
        }

        // Get members from form data
        const members: { userId: string; role: ProjectRole; joinedAt: Date }[] = [];
        const formEntries = Array.from(formData.entries());
        const memberEntries = formEntries.filter(([key]) => key.startsWith('members['));
        
        // Group member entries by index
        const membersByIndex = new Map<string, { userId?: string; role?: ProjectRole }>();
        memberEntries.forEach(([key, value]) => {
            const matches = key.match(/members\[(\d+)\]\[(\w+)\]/);
            if (matches) {
                const [, index, field] = matches;
                if (!membersByIndex.has(index)) {
                    membersByIndex.set(index, {});
                }
                const member = membersByIndex.get(index)!;
                if (field === 'userId') {
                    member.userId = value as string;
                } else if (field === 'role') {
                    member.role = value as ProjectRole;
                }
            }
        });

        // Convert to array and add joinedAt
        membersByIndex.forEach((member) => {
            if (member.userId && member.role) {
                members.push({
                    userId: member.userId,
                    role: member.role,
                    joinedAt: new Date()
                });
            }
        });

        // Add the creator as PRODUCT_OWNER if not already included
        if (!members.some(member => member.userId === session.user._id)) {
            members.push({
                userId: session.user._id,
                role: ProjectRole.PRODUCT_OWNER,
                joinedAt: new Date()
            });
        }

        const projectData = {
            name: formData.get('name') as string,
            description: formData.get('description') as string || undefined,
            boards: [],
            members
        };

        const validatedData = validateCreateProject(projectData);
        await addProject(validatedData);
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        if (error instanceof ZodError) {
            return createErrorResponse(new AppError(
                `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
                400,
                'ValidationError'
            ));
        }
        return createErrorResponse(error);
    }
}

// Create a new project
export async function addProject(projectData: Omit<Project, '_id' | 'createdAt'>): Promise<any | ErrorResponse> {
    try {
        const { db } = await connectToDatabase();
        const result = await db().collection('projects').insertOne({
            ...projectData,
            createdAt: new Date(),
        });
        
        return result;
    } catch (error) {
        return createErrorResponse(new AppError(
            `Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`,
            500,
            'ServerError'
        ));
    }
}

// Get project by ID
export async function getProjectById(id: string): Promise<Project | null | ErrorResponse> {
    try {
        if (!id) throw new AppError('Project ID is required', 400);
        
        const { db } = await connectToDatabase();
        const project = await db().collection('projects').findOne({ _id: new ObjectId(id) });
        return project ? JSON.parse(JSON.stringify(project)) : null;
    } catch (error) {
        return createErrorResponse(error);
    }
}

// Update project
export async function updateProject(id: string, projectData: Partial<Project>): Promise<any | ErrorResponse> {
    try {
        if (!id) throw new AppError('Project ID is required', 400);

        const validatedData = validateUpdateProject(projectData);

        const { db } = await connectToDatabase();
        const result = await db().collection('projects').updateOne(
            { _id: new ObjectId(id) },
            { $set: validatedData }
        );
        
        if (result.matchedCount === 0) {
            throw new AppError('Project not found', 404, 'NotFoundError');
        }
        
        revalidatePath('/dashboard');
        return result;
    } catch (error) {
        if (error instanceof ZodError) {
            return createErrorResponse(new AppError(
                `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
                400,
                'ValidationError'
            ));
        }
        return createErrorResponse(error);
    }
}

// Delete project
export async function deleteProject(id: string): Promise<any | ErrorResponse> {
    try {
        if (!id) throw new AppError('Project ID is required', 400, 'ValidationError');

        const { db } = await connectToDatabase();
        const result = await db().collection('projects').deleteOne({ _id: new ObjectId(id) });
        
        if (result.deletedCount === 0) {
            throw new AppError('Project not found', 404, 'NotFoundError');
        }
        
        revalidatePath('/dashboard');
        return result;
    } catch (error) {
        return createErrorResponse(error);
    }
}

// Add member to project
export async function addProjectMember(projectId: string, userId: string, role: ProjectRole): Promise<any | ErrorResponse> {
    try {
        if (!projectId) throw new AppError('Project ID is required', 400, 'ValidationError');
        console.log("addProjectMember", projectId, userId, role)

        // Validate the member data
        const validatedData = validateAddProjectMember({ userId, role });

        const { db } = await connectToDatabase();
        const result = await db().collection('projects').updateOne(
            { _id: new ObjectId(projectId) },
            { 
                $push: { 
                    members: {
                        ...validatedData,
                        joinedAt: new Date()
                    }
                }
            }
        );
        
        if (result.matchedCount === 0) {
            throw new AppError('Project not found', 404, 'NotFoundError');
        }
        
        revalidatePath('/dashboard');
        return result;
    } catch (error) {
        if (error instanceof ZodError) {
            return createErrorResponse(new AppError(
                `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
                400,
                'ValidationError'
            ));
        }
        return createErrorResponse(error);
    }
}

// Update member role in project
export async function updateProjectMemberRole(projectId: string, userId: string, newRole: ProjectRole) {
    try {
        if (!projectId) throw new Error('Project ID is required');
        if (!userId) throw new Error('User ID is required');

        // Validate the role
        validateAddProjectMember({ userId, role: newRole });

        const { db } = await connectToDatabase();
        const result = await db().collection('projects').updateOne(
            { 
                _id: projectId,
                'members.userId': userId
            },
            { 
                $set: { 
                    'members.$.role': newRole
                }
            }
        );
        
        if (result.matchedCount === 0) {
            throw new Error('Project or member not found');
        }
        
        revalidatePath('/dashboard');
        return result;
    } catch (error) {
        if (error instanceof ZodError) {
            throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
    }
}

// Remove member from project
export async function removeProjectMember(projectId: string, userId: string) {
    try {
        if (!projectId) throw new Error('Project ID is required');
        if (!userId) throw new Error('User ID is required');

        const { db } = await connectToDatabase();
        
        // Check if this would remove the last member
        const project = await db().collection('projects').findOne({ _id: new ObjectId(projectId) });
        if (!project) {
            throw new Error('Project not found');
        }
        
        if (project.members.length <= 1) {
            throw new Error('Cannot remove the last member from a project');
        }

        const result = await db().collection('projects').updateOne(
            { _id: new ObjectId(projectId) },
            { 
                $pull: { 
                    members: { userId }
                }
            }
        );
        
        if (result.matchedCount === 0) {
            throw new Error('Project not found');
        }
        
        revalidatePath('/dashboard');
        return result;
    } catch (error) {
        throw new Error(`Failed to remove member: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
} 