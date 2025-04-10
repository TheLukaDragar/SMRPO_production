'use server';

import { connectToDatabase } from "@/lib/db/connection";
import { revalidatePath } from 'next/cache';
import { validateCreateProject, validateUpdateProject, validateAddProjectMember } from '../validations/project-validations';
import { ZodError } from 'zod';
import { AppError, createErrorResponse, ErrorResponse } from '../utils/error-handling';
import { Project, ProjectRole } from '../types/project-types';
import { getSession } from '@/lib/auth/session';
import { ObjectId } from 'mongodb';
import { UserRole } from '../types/user-types';
// Get all projects
export async function getProjects(): Promise<Project[] | ErrorResponse> {
    try {
        const { db } = await connectToDatabase();
        const projects = await db().collection("projects").find({}).toArray();

        // Log the fetched projects before returning
        console.log("Projects fetched from DB:", projects);

        return projects.map((project: Project) => ({
            ...project,
            _id: project._id.toString(),
            estimated_time: project.estimated_time ?? 0
        }));
    } catch (error) {
        return createErrorResponse(error);
    }
}



//get my projects
export async function getMyProjects(): Promise<Project[] | ErrorResponse> {
    console.log("getMyProjects");
    try {
        const { db } = await connectToDatabase();
        const session = await getSession();
        if (!session?.user?._id) {
            return createErrorResponse(new AppError('User not authenticated', 401, 'AuthError'));
        }

        console.log("session", session);

        // If user is admin, return all projects
        if (session.user.role === UserRole.ADMINISTRATOR) {
            const projects = await db().collection('projects').find({}).toArray();
            console.log(projects);
            return JSON.parse(JSON.stringify(projects));
        }

        // Otherwise return only projects where user is a member
        const projects = await db().collection('projects').find({
            'members.userId': session.user._id
        }).toArray();
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

        const projectName = formData.get('name') as string;

        // Check for duplicate project name (case-insensitive)
        const { db } = await connectToDatabase();
        const existingProject = await db().collection('projects').findOne({ 
            name: { $regex: new RegExp(`^${projectName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } 
        });
        if (existingProject) {
            return createErrorResponse(new AppError('A project with this name already exists', 400, 'ValidationError'));
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
        const seenUserIds = new Set<string>();
        let productOwnerCount = 0;

        membersByIndex.forEach((member) => {
            if (member.userId && member.role) {
                // Check for duplicate users
                if (seenUserIds.has(member.userId)) {
                    throw new AppError('Duplicate user found in project members', 400, 'ValidationError');
                }
                seenUserIds.add(member.userId);

                // Count PRODUCT_OWNER roles
                if (member.role === ProjectRole.PRODUCT_OWNER) {
                    productOwnerCount++;
                }

                members.push({
                    userId: member.userId,
                    role: member.role,
                    joinedAt: new Date()
                });
            }
        });

        // Validate PRODUCT_OWNER count
        if (productOwnerCount === 0) {
            throw new AppError('Project must have exactly one Product Owner', 400, 'ValidationError');
        }

        const projectData = {
            name: formData.get('name') as string,
            description: formData.get('description') as string || undefined,
            estimated_time: formData.get('estimated_time') ? parseInt(formData.get('estimated_time') as string, 10) : 0,
            boards: [],
            members
        };

        const validatedData = validateCreateProject(projectData);
        await addProject({
            ...validatedData,
            estimated_time: projectData.estimated_time, // Use estimated_time from projectData
        });
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        if (error instanceof AppError) {
            return createErrorResponse(error);
        }
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
            estimated_time: projectData.estimated_time ?? 0, // Ensure it's stored properly
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
        if (!id) throw new AppError("Project ID is required", 400);

        const validatedData = validateUpdateProject(projectData);
        
        const { db } = await connectToDatabase();
        
        // If project name is being updated, check for duplicates (case-insensitive)
        if (projectData.name) {
            // Check for duplicate project name (case-insensitive)
            // Exclude the current project from the check (to allow keeping the same name with different case)
            const existingProject = await db().collection('projects').findOne({ 
                _id: { $ne: new ObjectId(id) },
                name: { $regex: new RegExp(`^${projectData.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } 
            });
            
            if (existingProject) {
                throw new AppError('A project with this name already exists', 400, 'ValidationError');
            }
        }

        console.log("Before update, received projectData:", projectData);

        const result = await db().collection("projects").updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    ...validatedData,
                    estimated_time: projectData.estimated_time !== undefined ? projectData.estimated_time : 0,
                },
            }
        );

        if (result.matchedCount === 0) {
            throw new AppError("Project not found", 404, "NotFoundError");
        }

        revalidatePath("/dashboard");
        return result;
    } catch (error) {
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

        // Check if user is already a member
        const existingMember = await db().collection('projects').findOne({
            _id: new ObjectId(projectId),
            'members.userId': userId
        });

        if (existingMember) {
            throw new AppError('User is already a member of this project', 400, 'ValidationError');
        }

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
                _id: new ObjectId(projectId),
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

// Get project members
export async function getProjectMembers(projectId: string) {
    try {
        if (!projectId) throw new Error('Project ID is required');

        const { db } = await connectToDatabase();
        const project = await db().collection('projects').findOne({ _id: new ObjectId(projectId) });
        if (!project) {
            throw new Error('Project not found');
        }
        return project.members;
    } catch (error) {
        return createErrorResponse(error);
    }
}

export async function leaveProject(projectId: string, userId: string) {
    try {
        if (!projectId || !userId) throw new AppError("Project ID and User ID are required", 400);

        const { db } = await connectToDatabase();
        const project = await db().collection("projects").findOne({ _id: new ObjectId(projectId) });

        if (!project) throw new AppError("Project not found", 404);

        // Find the user in the members list
        const memberIndex = project.members.findIndex((member: { userId: string; role: string }) => member.userId === userId);
        if (memberIndex === -1) throw new AppError("You are not a member of this project", 403);

        // Remove the user from the project
        await db().collection("projects").updateOne(
            { _id: new ObjectId(projectId) },
            { $pull: { members: { userId } } }
        );

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        return createErrorResponse(error);
    }
}

export async function becomeProductOwner(projectId: string, userId: string) {
    try {
        if (!projectId || !userId) {
            return { error: "Project ID and User ID are required" };
        }

        const { db } = await connectToDatabase();
        const project = await db().collection("projects").findOne({ _id: new ObjectId(projectId) });

        if (!project) {
            return { error: "Project not found" };
        }

        // Check if the user is already a member
        const isMember = project.members.some((member: { userId: string; role: string }) => member.userId === userId);

        // Ensure there is currently no Product Owner
        const hasProductOwner = project.members.some((member: { userId: string; role: string }) => member.role === "PRODUCT_OWNER");
        if (hasProductOwner) {
            return { error: "This project already has a Product Owner." };
        }

        // If user is not a member, add them
        if (!isMember) {
            await db().collection("projects").updateOne(
                { _id: new ObjectId(projectId) },
                {
                    $push: { members: { userId, role: "PRODUCT_OWNER" } } // Add as member & Product Owner
                }
            );
        } else {
            // If user is already a member, update their role to Product Owner
            await db().collection("projects").updateOne(
                { _id: new ObjectId(projectId), "members.userId": userId },
                { $set: { "members.$.role": "PRODUCT_OWNER" } }
            );
        }

        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Internal Server Error" };
    }
}


