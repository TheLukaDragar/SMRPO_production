"use client"

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useProject } from '@/lib/contexts/project-context';
import { User } from '@/lib/types/user-types';
import { getUsers } from '@/lib/actions/user-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProjectRole } from '@/lib/types/project-types';
import { useUser } from '@/lib/hooks/useUser';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, UserPlus, AlertCircle, X } from 'lucide-react';
import { AddTeamMemberDialog } from '@/components/add-team-member-dialog';
import { removeProjectMember } from '@/lib/actions/project-actions';
import { useToast } from '@/components/ui/use-toast';

export default function ProjectTeamSettings() {
    const params = useParams();
    const projectId = params.projectId as string;
    const { activeProject, refreshProject } = useProject();
    const { user } = useUser();
    const { toast } = useToast();
    console.log(projectId)
    
    const [users, setUsers] = useState<User[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRefetching, setIsRefetching] = useState(false);
    const [canManageTeam, setCanManageTeam] = useState(false);

    useEffect(() => {
        if (activeProject && user) {
            const userRole = activeProject.members?.find(m => m.userId === user._id)?.role;
            setCanManageTeam(userRole === ProjectRole.SCRUM_MASTER || user.role === "Administrator");
        }
    }, [activeProject, user]);

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

    return (
        <div className="space-y-8 p-6">
            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Team Settings
                </h1>
                <p className="text-lg text-muted-foreground">
                    Manage team members for <span className="font-medium text-gray-900">{activeProject?.name}</span>
                </p>
            </div>

            <div className="flex justify-end">
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
                                className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-200 ${
                                    canManageTeam
                                        ? 'bg-black text-white hover:bg-gray-800 cursor-pointer shadow-lg hover:shadow-xl'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                <UserPlus className="h-5 w-5" />
                                Add Team Member
                            </motion.button>
                        }
                    />
                    {!canManageTeam && (
                        <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
                            <div className="bg-gray-900 text-white text-sm rounded-lg py-2 px-4 shadow-xl">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    Only Scrum Masters and Administrators can manage team members
                                </div>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Card className="shadow-lg border-gray-100">
                <CardHeader className="border-b">
                    <CardTitle className="text-xl flex items-center gap-2">
                        Current Team Members
                        {isRefetching && (
                            <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <AnimatePresence>
                        <div className="space-y-4">
                            {activeProject?.members?.map((member, index) => {
                                const memberUser = users.find(u => u._id === member.userId);
                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.2, delay: index * 0.05 }}
                                        key={member.userId}
                                        className="group flex items-center justify-between p-4 border rounded-xl bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200"
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
                                            <Badge 
                                                variant={getRoleBadgeVariant(member.role)}
                                                className="px-3 py-1 text-xs font-medium rounded-full"
                                            >
                                                {member.role}
                                            </Badge>
                                            {canManageTeam && member.userId !== user?._id && (
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-full hover:bg-red-50"
                                                    onClick={() => handleRemoveMember(member.userId)}
                                                >
                                                    <X className="h-4 w-4 text-red-500" />
                                                </motion.button>
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