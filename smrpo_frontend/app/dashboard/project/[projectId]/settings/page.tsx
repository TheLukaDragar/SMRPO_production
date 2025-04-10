"use client"

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useProject } from '@/lib/contexts/project-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { updateProject, removeProjectMember, updateProjectMemberRole } from '@/lib/actions/project-actions';
import { getUsers } from '@/lib/actions/user-actions';
import { useToast } from '@/components/ui/use-toast';
import { ProjectRole } from '@/lib/types/project-types';
import { User } from '@/lib/types/user-types';
import { useUser } from '@/lib/hooks/useUser';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, AlertCircle, Loader2, UserPlus, X, Edit, Check, ChevronDown } from 'lucide-react';
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
    
    // Team Settings state
    const [users, setUsers] = useState<User[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRefetching, setIsRefetching] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [isUpdatingRole, setIsUpdatingRole] = useState(false);
    const [selectedRole, setSelectedRole] = useState<ProjectRole | null>(null);
    
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

    const handleStartEditRole = (userId: string, currentRole: ProjectRole) => {
        setEditingUserId(userId);
        setSelectedRole(currentRole);
    };

    const handleCancelEditRole = () => {
        setEditingUserId(null);
        setSelectedRole(null);
    };

    const handleUpdateRole = async (userId: string) => {
        if (!selectedRole) return;
        
        // Check if trying to change the last Product Owner
        if (activeProject?.members) {
            const currentMember = activeProject.members.find(m => m.userId === userId);
            const productOwners = activeProject.members.filter(m => m.role === ProjectRole.PRODUCT_OWNER);
            
            if (currentMember?.role === ProjectRole.PRODUCT_OWNER && selectedRole !== ProjectRole.PRODUCT_OWNER && productOwners.length <= 1) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Cannot change the last Product Owner. Please assign another Product Owner first."
                });
                handleCancelEditRole();
                return;
            }
            
            // If changing to Product Owner, we need to check and handle the current Product Owner
            if (selectedRole === ProjectRole.PRODUCT_OWNER) {
                // First, update any existing Product Owner to a Developer role
                for (const member of productOwners) {
                    if (member.userId !== userId) {
                        try {
                            setIsUpdatingRole(true);
                            await updateProjectMemberRole(projectId, member.userId, ProjectRole.DEVELOPER);
                        } catch (error) {
                            toast({
                                variant: "destructive",
                                title: "Error",
                                description: "Failed to update previous Product Owner's role"
                            });
                            handleCancelEditRole();
                            setIsUpdatingRole(false);
                            return;
                        }
                    }
                }
            }
        }
        
        try {
            setIsUpdatingRole(true);
            await updateProjectMemberRole(projectId, userId, selectedRole);
            toast({
                variant: "success",
                title: "Success",
                description: "Team member role updated successfully",
            });
            refreshProject();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update team member role",
            });
        } finally {
            setIsUpdatingRole(false);
            setEditingUserId(null);
            setSelectedRole(null);
        }
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
                        
                        <div className="relative group">
                            <AddTeamMemberDialog
                                projectId={projectId}
                                open={isModalOpen}
                                onOpenChange={setIsModalOpen}
                                onSuccess={() => {
                                    refreshProject();
                                    fetchUsers();
                                }}
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
                    <CardContent>
                        <AnimatePresence>
                            <div className="space-y-4">
                                {activeProject?.members?.map((member, index) => {
                                    const memberUser = users.find(u => u._id === member.userId);
                                    const isEditing = editingUserId === member.userId;
                                    
                                    return (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.2, delay: index * 0.05 }}
                                            key={member.userId}
                                            className="group flex items-center justify-between p-3 border rounded-md bg-card hover:bg-card/95 hover:shadow-sm transition-all duration-200"
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
                                                            value={selectedRole || member.role}
                                                            onValueChange={(value) => setSelectedRole(value as ProjectRole)}
                                                            disabled={isUpdatingRole}
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
                                                            className="p-2 rounded-md bg-green-50/50 text-green-600 hover:bg-green-100/80"
                                                            onClick={() => handleUpdateRole(member.userId)}
                                                            disabled={isUpdatingRole}
                                                        >
                                                            {isUpdatingRole ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Check className="h-4 w-4" />
                                                            )}
                                                        </motion.button>
                                                        
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            className="p-2 rounded-md bg-muted text-muted-foreground hover:bg-muted/80"
                                                            onClick={handleCancelEditRole}
                                                            disabled={isUpdatingRole}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </motion.button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Badge 
                                                            variant={getRoleBadgeVariant(member.role)}
                                                            className="px-3 py-1 text-xs font-medium rounded-full"
                                                        >
                                                            {member.role}
                                                        </Badge>
                                                        
                                                        {canManageTeam && (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.05 }}
                                                                        whileTap={{ scale: 0.95 }}
                                                                        className="opacity-0 group-hover:opacity-100 p-2 rounded-md hover:bg-muted transition-opacity duration-200"
                                                                    >
                                                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                                    </motion.button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem 
                                                                        className="flex items-center gap-2 cursor-pointer"
                                                                        onClick={() => handleStartEditRole(member.userId, member.role)}
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                        Edit Role
                                                                    </DropdownMenuItem>
                                                                    {member.userId !== user?._id && (
                                                                        <DropdownMenuItem 
                                                                            className="flex items-center gap-2 text-red-600 cursor-pointer"
                                                                            onClick={() => handleRemoveMember(member.userId)}
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                            Remove Member
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                                {(!activeProject?.members || activeProject.members.length === 0) && (
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
                </Card>
            </div>
            
            {/* Empty space for better scrolling */}
            <div className="h-32" />
        </div>
    );
} 