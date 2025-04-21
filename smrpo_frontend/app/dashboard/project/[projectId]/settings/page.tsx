"use client"

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useProject } from '@/lib/contexts/project-context';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
    updateProject, 
    removeProjectMember, 
    updateProjectMemberRole, 
    addProjectMember,
    updateProjectTeamBulk
} from '@/lib/actions/project-actions';
import { getUsers } from '@/lib/actions/user-actions';
import { useToast } from '@/components/ui/use-toast';
import { ProjectRole, ProjectMember } from '@/lib/types/project-types';
import { User } from '@/lib/types/user-types';
import { useUser } from '@/lib/hooks/useUser';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, AlertCircle, Loader2, UserPlus, X, Edit, Check, ChevronDown, Undo, UserMinus, InfoIcon } from 'lucide-react';
import { AddTeamMemberDialog } from '@/components/add-team-member-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';

// Define type for team member changes
type MemberChange = {
    userId: string;
    type: 'add' | 'remove' | 'update';
    role?: ProjectRole;
    originalRole?: ProjectRole;
};

export default function ProjectSettings() {
    const params = useParams();
    const projectId = params.projectId as string;
    const { activeProject, refreshProject } = useProject();
    const { user } = useUser();
    const { toast } = useToast();
    
    // General Settings state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Team Settings state with new state for tracking changes
    const [users, setUsers] = useState<User[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRefetching, setIsRefetching] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [memberChanges, setMemberChanges] = useState<MemberChange[]>([]);
    const [isSavingTeam, setIsSavingTeam] = useState(false);
    const [pendingMembers, setPendingMembers] = useState<{userId: string, role: ProjectRole}[]>([]);
    
    // Check permissions
    const canEditProject = user?.role === 'Administrator' || 
        activeProject?.members?.some(m => 
            m.userId === user?._id && 
            (m.role === ProjectRole.SCRUM_MASTER || m.role === ProjectRole.PRODUCT_OWNER)
        );
    
    const canManageTeam = user?.role === 'Administrator' || 
        activeProject?.members?.some(m => 
            m.userId === user?._id && m.role === ProjectRole.SCRUM_MASTER
        );

    // Update form data when project data changes
    useEffect(() => {
        if (activeProject) {
            setFormData({
                name: activeProject.name || '',
                description: activeProject.description || '',
            });
        }
    }, [activeProject]);

    // Load users for team management
    const fetchUsers = async () => {
        try {
            setIsRefetching(true);
            const userData = await getUsers();
            setUsers(userData);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setIsRefetching(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // General settings handlers
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!canEditProject) {
            toast({
                variant: "destructive",
                title: "Permission Denied",
                description: "You don't have permission to edit this project."
            });
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            const result = await updateProject(projectId, {
                name: formData.name,
                description: formData.description,
            });
            
            if ('error' in result) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error.message,
                });
            } else {
                toast({
                    variant: "success",
                    title: "Success",
                    description: "Project updated successfully",
                });
                refreshProject();
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update project",
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Team settings handlers
    const handleRemoveMember = async (userId: string) => {
        try {
            const result = await removeProjectMember(projectId, userId);
            if ('error' in result) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error.message,
                });
            } else {
                toast({
                    variant: "success",
                    title: "Success",
                    description: "Team member removed successfully",
                });
                refreshProject();
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to remove team member",
            });
        }
    };

    // New function to handle member role change
    const handleRoleChange = (userId: string, role: ProjectRole) => {
        // Find the member
        const member = activeProject?.members?.find(m => m.userId === userId);
        if (!member) return;
        
        // Check existing changes for this user
        const existingChangeIndex = memberChanges.findIndex(
            change => change.userId === userId && change.type === 'update'
        );
        
        if (existingChangeIndex >= 0) {
            // If the role is the same as original, remove the change
            if (memberChanges[existingChangeIndex].originalRole === role) {
                setMemberChanges(prev => prev.filter((_, i) => i !== existingChangeIndex));
            } else {
                // Update existing change
                setMemberChanges(prev => {
                    const updated = [...prev];
                    updated[existingChangeIndex] = { ...updated[existingChangeIndex], role };
                    return updated;
                });
            }
        } else {
            // Add new change
            setMemberChanges(prev => [
                ...prev,
                {
                    userId,
                    type: 'update',
                    role,
                    originalRole: member.role
                }
            ]);
        }
        
        // Close the role editing UI
        setEditingUserId(null);
    };
    
    // Function to mark member for removal
    const handleMarkForRemoval = (userId: string) => {
        // Find if this user has any pending changes
        const existingChangeIndex = memberChanges.findIndex(change => change.userId === userId);
        
        if (existingChangeIndex >= 0) {
            // If it's a new member being added, just remove them from changes
            if (memberChanges[existingChangeIndex].type === 'add') {
                setMemberChanges(prev => prev.filter((_, i) => i !== existingChangeIndex));
                setPendingMembers(prev => prev.filter(m => m.userId !== userId));
                return;
            }
            
            // Otherwise update the change to 'remove'
            setMemberChanges(prev => {
                const updated = [...prev];
                updated[existingChangeIndex] = { 
                    userId, 
                    type: 'remove',
                    originalRole: memberChanges[existingChangeIndex].originalRole 
                };
                return updated;
            });
        } else {
            // Add new remove change
            const member = activeProject?.members?.find(m => m.userId === userId);
            if (!member) return;
            
            setMemberChanges(prev => [
                ...prev,
                {
                    userId,
                    type: 'remove',
                    originalRole: member.role
                }
            ]);
        }
    };
    
    // Function to undo changes for a member
    const handleUndoChange = (userId: string) => {
        setMemberChanges(prev => prev.filter(change => change.userId !== userId));
        
        // Also remove from pending members if applicable
        setPendingMembers(prev => prev.filter(m => m.userId !== userId));
        
        // If currently editing this user, cancel editing
        if (editingUserId === userId) {
            setEditingUserId(null);
        }
    };
    
    // Function to handle adding a team member
    const handleAddTeamMember = (userId: string, role: ProjectRole) => {
        // Check if user is already a team member or pending
        const isExistingMember = activeProject?.members?.some(m => m.userId === userId);
        const isPendingMember = pendingMembers.some(m => m.userId === userId);
        
        if (isExistingMember || isPendingMember) {
                            toast({
                                variant: "destructive",
                                title: "Error",
                description: "This user is already a team member"
                            });
                            return;
                        }
        
        // Add to pending members
        setPendingMembers(prev => [...prev, { userId, role }]);
        
        // Add to changes
        setMemberChanges(prev => [
            ...prev,
            {
                userId,
                type: 'add',
                role
            }
        ]);
        
        setIsModalOpen(false);
    };
    
    // Function to save all changes
    const handleSaveTeamChanges = async () => {
        if (memberChanges.length === 0) return;

        // First do a client-side validation of the final state
        try {
            // Get current team members with changes applied
            const currentMembers = [...(activeProject?.members || [])];
            const updatedMembers = currentMembers.filter(member => 
                !memberChanges.some(change => change.type === 'remove' && change.userId === member.userId)
            );

            // Apply updates
            memberChanges.filter(change => change.type === 'update').forEach(change => {
                const index = updatedMembers.findIndex(m => m.userId === change.userId);
                if (index !== -1 && change.role) {
                    updatedMembers[index] = { ...updatedMembers[index], role: change.role };
                }
            });

            // Add new members
            memberChanges.filter(change => change.type === 'add').forEach(change => {
                if (change.role) {
                    updatedMembers.push({
                        userId: change.userId,
                        role: change.role,
                        joinedAt: new Date()
                    });
                }
            });

            // Validate final state
            const productOwnerCount = updatedMembers.filter(m => m.role === ProjectRole.PRODUCT_OWNER).length;
            const scrumMasterCount = updatedMembers.filter(m => 
                m.role === ProjectRole.SCRUM_MASTER || m.role === ProjectRole.SCRUM_DEV
            ).length;
            const developerCount = updatedMembers.filter(m => 
                m.role === ProjectRole.DEVELOPER || m.role === ProjectRole.SCRUM_DEV
            ).length;

            if (productOwnerCount !== 1) {
                throw new Error(`Project must have exactly one Product Owner. Found ${productOwnerCount}.`);
            }

            if (scrumMasterCount === 0) {
                throw new Error('Project must have at least one Scrum Master or Scrum Dev.');
            } else if (scrumMasterCount > 1) {
                throw new Error('Project can have at most one Scrum Master or Scrum Dev.');
            }

            if (developerCount === 0) {
                throw new Error('Project must have at least one Developer.');
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: error instanceof Error ? error.message : "Invalid team composition"
            });
            return;
        }
        
        setIsSavingTeam(true);
        
        try {
            // Convert our changes to the format expected by the bulk update function
            const operations = memberChanges.map(change => {
                switch (change.type) {
                    case 'add':
                        return {
                            userId: change.userId,
                            operation: 'add' as const,
                            role: change.role
                        };
                    case 'remove':
                        return {
                            userId: change.userId,
                            operation: 'remove' as const
                        };
                    case 'update':
                        return {
                            userId: change.userId,
                            operation: 'update' as const,
                            role: change.role
                        };
                    default:
                        throw new Error(`Unknown change type: ${change.type}`);
                }
            });

            // Call the bulk update function
            const result = await updateProjectTeamBulk(projectId, operations);
            
            if ('error' in result) {
                toast({
                    variant: "destructive",
                    title: "Team Update Failed",
                    description: result.error.message
                });
            } else {
                toast({
                    variant: "success",
                    title: "Success",
                    description: `Team updated successfully with ${operations.length} changes.`
                });
                
                // Clear all changes
                setMemberChanges([]);
                setPendingMembers([]);
                
                // Refresh project data
                refreshProject();
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to save team changes"
            });
        } finally {
            setIsSavingTeam(false);
        }
    };
    
    // Function to get effective role (considering pending changes)
    const getEffectiveRole = (userId: string, currentRole: ProjectRole): ProjectRole | null => {
        const change = memberChanges.find(c => c.userId === userId);
        
        if (!change) return currentRole;
        
        if (change.type === 'remove') return null; // Will be removed
        if (change.type === 'update' && change.role) return change.role;
        
        return currentRole;
    };
    
    // Function to check if a member has pending changes
    const hasChanges = (userId: string): boolean => {
        return memberChanges.some(change => change.userId === userId);
    };

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
    
    // New function to get badge style based on member status
    function getMemberBadgeStyle(userId: string) {
        const change = memberChanges.find(c => c.userId === userId);
        
        if (!change) return "";
        
        if (change.type === 'remove') return "opacity-50 line-through";
        if (change.type === 'add') return "border-green-500 border";
        if (change.type === 'update') return "border-yellow-500 border";
        
        return "";
    }
    
    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Project Settings</h1>
                <p className="text-muted-foreground">
                    Manage settings for <span className="font-medium">{activeProject?.name}</span>
                </p>
            </div>
            
            {/* General Settings Section */}
            <div className="space-y-6">
                <h2 className="text-xl font-semibold">General</h2>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Project Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Project Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    disabled={!canEditProject}
                                    placeholder="Enter project name"
                                    required
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    disabled={!canEditProject}
                                    placeholder="Enter project description"
                                    rows={4}
                                />
                            </div>
                            
                            <div className="flex justify-end pt-4">
                                <div className="relative group">
                                    <motion.button
                                        whileHover={{ scale: canEditProject ? 1.02 : 1 }}
                                        whileTap={{ scale: canEditProject ? 0.98 : 1 }}
                                        type="submit"
                                        disabled={!canEditProject || isSubmitting}
                                        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md ${
                                            canEditProject
                                                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                                : 'bg-muted text-muted-foreground cursor-not-allowed'
                                        }`}
                                    >
                                        <Save className="h-4 w-4" />
                                        {isSubmitting ? "Saving..." : "Save Changes"}
                                    </motion.button>
                                    
                                    {!canEditProject && (
                                        <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
                                            <div className="bg-popover text-popover-foreground text-sm rounded-lg py-2 px-3 shadow-md">
                                                <div className="flex items-center gap-2">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <span>Only Administrators, Scrum Masters and Product Owners can edit</span>
                                                </div>
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-popover"></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
            
            {/* Separator */}
            <div className="border-t my-4" />
            
            {/* Team Settings Section */}
            <div className="space-y-6">
                <h2 className="text-xl font-semibold">Team</h2>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            Team Members
                            {isRefetching && (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                        </CardTitle>
                        
                        <div className="flex items-center gap-2 relative group">
                            <AddTeamMemberDialog
                                projectId={projectId}
                                open={isModalOpen}
                                onOpenChange={setIsModalOpen}
                                onAddMember={handleAddTeamMember}
                                trigger={
                                    <motion.button
                                        whileHover={{ scale: canManageTeam ? 1.02 : 1 }}
                                        whileTap={{ scale: canManageTeam ? 0.98 : 1 }}
                                        disabled={!canManageTeam}
                                        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md ${
                                            canManageTeam
                                                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                                : 'bg-muted text-muted-foreground cursor-not-allowed'
                                        }`}
                                    >
                                        <UserPlus className="h-4 w-4" />
                                        Add Team Member
                                    </motion.button>
                                }
                            />
                            {!canManageTeam && (
                                <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
                                    <div className="bg-popover text-popover-foreground text-sm rounded-lg py-2 px-3 shadow-md">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            <span>Only Scrum Masters and Administrators can manage team</span>
                                        </div>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-popover"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    
                    {/* Role constraints information panel */}
                    <div className="px-6 py-3 border-t border-b bg-blue-50/50 flex gap-2 items-start">
                        <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-muted-foreground">
                            <p className="font-medium text-foreground mb-1">Team Role Requirements:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Project must have exactly one Product Owner</li>
                                <li>Project must have at least one Scrum Master (or Scrum Dev)</li>
                                <li>Project must have at least one Developer</li>
                                <li>Project can have at most one Scrum Master or Scrum Dev</li>
                                <li>A Scrum Dev counts as both a Scrum Master and a Developer</li>
                            </ul>
                        </div>
                    </div>
                    
                    <CardContent>
                        <AnimatePresence>
                            <div className="space-y-4">
                                {/* Existing team members */}
                                {activeProject?.members?.map((member, index) => {
                                    const memberUser = users.find(u => u._id === member.userId);
                                    const isEditing = editingUserId === member.userId;
                                    const effectiveRole = getEffectiveRole(member.userId, member.role);
                                    const isPendingRemoval = memberChanges.some(
                                        c => c.userId === member.userId && c.type === 'remove'
                                    );
                                    
                                    // Skip rendering if member is being removed
                                    if (isPendingRemoval && !canManageTeam) return null;
                                    
                                    return (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.2, delay: index * 0.05 }}
                                            key={member.userId}
                                            className={`group flex items-center justify-between p-3 border rounded-md bg-card hover:bg-card/95 hover:shadow-sm transition-all duration-200 ${getMemberBadgeStyle(member.userId)}`}
                                        >
                                            <div className="space-y-1">
                                                <div className="font-medium text-gray-900">
                                                    {memberUser ? `${memberUser.firstName} ${memberUser.lastName}` : member.userId}
                                                </div>
                                                <div className="text-sm text-gray-500 flex items-center gap-2">
                                                    {memberUser?.email || 'Email not available'}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {isEditing ? (
                                                    <div className="flex items-center gap-2">
                                                        <Select
                                                            defaultValue={effectiveRole || member.role}
                                                            onValueChange={(value) => handleRoleChange(member.userId, value as ProjectRole)}
                                                        >
                                                            <SelectTrigger className="w-[180px]">
                                                                <SelectValue placeholder="Select role" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Object.values(ProjectRole).map((role) => (
                                                                    <SelectItem key={role} value={role}>
                                                                        {role.replace('_', ' ')}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            className="p-2 rounded-md bg-muted text-muted-foreground hover:bg-muted/80"
                                                            onClick={() => setEditingUserId(null)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </motion.button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Badge 
                                                            variant={getRoleBadgeVariant(effectiveRole || member.role)}
                                                            className={`px-3 py-1 text-xs font-medium rounded-full ${isPendingRemoval ? 'line-through opacity-50' : ''}`}
                                                        >
                                                            {effectiveRole || member.role}
                                                        </Badge>
                                                        
                                                        {canManageTeam && (
                                                            <div className="flex items-center gap-2">
                                                                {hasChanges(member.userId) ? (
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.05 }}
                                                                        whileTap={{ scale: 0.95 }}
                                                                        className="p-2 rounded-md bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                                                                        onClick={() => handleUndoChange(member.userId)}
                                                                    >
                                                                        <Undo className="h-4 w-4" />
                                                                    </motion.button>
                                                                ) : (
                                                                    <>
                                                                        <motion.button
                                                                            whileHover={{ scale: 1.05 }}
                                                                            whileTap={{ scale: 0.95 }}
                                                                            className="p-2 rounded-md hover:bg-muted"
                                                                            onClick={() => setEditingUserId(member.userId)}
                                                                        >
                                                                            <Edit className="h-4 w-4 text-muted-foreground" />
                                                                        </motion.button>
                                                                        
                                                                        {member.userId !== user?._id && (
                                                                            <motion.button
                                                                                whileHover={{ scale: 1.05 }}
                                                                                whileTap={{ scale: 0.95 }}
                                                                                className="p-2 rounded-md hover:bg-red-100 text-red-500"
                                                                                onClick={() => handleMarkForRemoval(member.userId)}
                                                                            >
                                                                                <UserMinus className="h-4 w-4" />
                                                                            </motion.button>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                                
                                {/* Pending new members */}
                                {pendingMembers.map((member, index) => {
                                    const memberUser = users.find(u => u._id === member.userId);
                                    
                                    return (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.2, delay: index * 0.05 }}
                                            key={`pending-${member.userId}`}
                                            className="group flex items-center justify-between p-3 border rounded-md bg-card hover:bg-card/95 hover:shadow-sm transition-all duration-200 border-green-500"
                                        >
                                            <div className="space-y-1">
                                                <div className="font-medium text-gray-900">
                                                    {memberUser ? `${memberUser.firstName} ${memberUser.lastName}` : member.userId}
                                                    <span className="ml-2 text-xs text-green-600 font-medium">(New)</span>
                                                </div>
                                                <div className="text-sm text-gray-500 flex items-center gap-2">
                                                    {memberUser?.email || 'Email not available'}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge variant={getRoleBadgeVariant(member.role)} className="px-3 py-1 text-xs font-medium rounded-full">
                                                    {member.role}
                                                </Badge>
                                                
                                                {canManageTeam && (
                                                    <div className="flex items-center gap-2">
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            className="p-2 rounded-md bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                                                            onClick={() => handleUndoChange(member.userId)}
                                                        >
                                                            <Undo className="h-4 w-4" />
                                                        </motion.button>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                                
                                {(!activeProject?.members || activeProject.members.length === 0) && pendingMembers.length === 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-12 text-gray-500 bg-gray-50/50 rounded-xl border-2 border-dashed"
                                    >
                                        <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                        <p className="text-lg font-medium">No team members found</p>
                                        <p className="text-sm">Add team members to get started</p>
                                    </motion.div>
                                )}
                            </div>
                        </AnimatePresence>
                    </CardContent>
                    
                    {canManageTeam && memberChanges.length > 0 && (
                        <CardFooter className="border-t flex justify-between items-center pt-4">
                            <div className="text-sm text-muted-foreground">
                                {memberChanges.length} pending changes
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setMemberChanges([]);
                                        setPendingMembers([]);
                                        setEditingUserId(null);
                                    }}
                                    disabled={isSavingTeam}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleSaveTeamChanges}
                                    disabled={isSavingTeam}
                                    className="flex items-center gap-2"
                                >
                                    {isSavingTeam ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    {isSavingTeam ? "Saving..." : "Save Team Changes"}
                                </Button>
                            </div>
                        </CardFooter>
                    )}
                </Card>
            </div>
            
            {/* Empty space for better scrolling */}
            <div className="h-32" />
        </div>
    );
} 