"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { handleAddProject } from "@/lib/actions/project-actions"
import { searchUsers, getUsers } from "@/lib/actions/user-actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PlusIcon, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { ProjectRole } from "@/lib/types/project-types"
import { User } from "@/lib/types/user-types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface SelectedUser {
  user: User;
  role: ProjectRole;
}

interface ProjectFormDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function ProjectFormDialog({ open: externalOpen, onOpenChange: externalOnOpenChange, trigger }: ProjectFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([])
  const [userPopoverOpen, setUserPopoverOpen] = useState(false)
  const [estimatedTime, setEstimatedTime] = useState<number | "">("");
  const formRef = useRef<HTMLFormElement>(null)
  const { toast } = useToast()

  // Determine if we're using external or internal state control
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = isControlled
    ? (newOpen: boolean) => externalOnOpenChange?.(newOpen)
    : setInternalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Clear all form-related states when closing
      setError(null)
      setSearchQuery("")
      setSelectedUsers([])
      setUserPopoverOpen(false)
      formRef.current?.reset()
    }
    setOpen(newOpen)
  }

  // Load all users when component mounts
  useEffect(() => {
    const loadUsers = async () => {
      const results = await getUsers()
      setUsers(results)
      setFilteredUsers(results)
    }
    loadUsers()
  }, [])

  // Filter users locally based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = users.filter(user =>
      user.userName.toLowerCase().includes(query) ||
      user.firstName.toLowerCase().includes(query) ||
      user.lastName.toLowerCase().includes(query)
    )
    setFilteredUsers(filtered)
  }, [searchQuery, users])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)

      // Add selected users to form data
      selectedUsers.forEach((selectedUser, index) => {
        formData.append(`members[${index}][userId]`, selectedUser.user._id)
        formData.append(`members[${index}][role]`, selectedUser.role)
      })

      const result = await handleAddProject(formData)

      if ('error' in result) {
        setError(result.error.message)
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error.message,
        })
      } else {
        // Clear form and state before closing dialog
        formRef.current?.reset()
        setSelectedUsers([])
        setSearchQuery("")
        setError(null)

        toast({
          variant: "success",
          title: "Success",
          description: "Project created successfully",
        })

        // Close dialog last
        setOpen(false)
      }
    } catch (err) {
      console.error(err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectUser = (user: User) => {
    if (!selectedUsers.some(selected => selected.user._id === user._id)) {
      // If no PRODUCT_OWNER exists yet, set this user as PRODUCT_OWNER
      const hasProductOwner = selectedUsers.some(selected => selected.role === ProjectRole.PRODUCT_OWNER);
      setSelectedUsers([...selectedUsers, {
        user,
        role: hasProductOwner ? ProjectRole.DEVELOPER : ProjectRole.PRODUCT_OWNER
      }]);
    }
    setUserPopoverOpen(false)
    setSearchQuery("")
  }

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(selected => selected.user._id !== userId))
  }

  const handleRoleChange = (userId: string, role: ProjectRole) => {
    // If changing from PRODUCT_OWNER, ensure there's another PRODUCT_OWNER
    const currentUser = selectedUsers.find(selected => selected.user._id === userId);
    if (currentUser?.role === ProjectRole.PRODUCT_OWNER && role !== ProjectRole.PRODUCT_OWNER) {
      const otherProductOwner = selectedUsers.some(
        selected => selected.user._id !== userId && selected.role === ProjectRole.PRODUCT_OWNER
      );
      if (!otherProductOwner) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Project must have exactly one Product Owner. Please assign another Product Owner first."
        });
        return;
      }
    }

    // If changing to PRODUCT_OWNER, remove other PRODUCT_OWNER
    if (role === ProjectRole.PRODUCT_OWNER) {
      setSelectedUsers(selectedUsers.map(selected => ({
        ...selected,
        role: selected.user._id === userId ? role :
          (selected.role === ProjectRole.PRODUCT_OWNER ? ProjectRole.DEVELOPER : selected.role)
      })));
    } else {
      setSelectedUsers(selectedUsers.map(selected =>
        selected.user._id === userId ? { ...selected, role } : selected
      ));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      ) : isControlled ? null : (
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <PlusIcon className="h-4 w-4 mr-1" />
            Add
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[1000px] h-[95vh] max-h-[1000px] flex flex-col p-0">
        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="px-6 py-4 border-b">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Create a new project workspace for your team.
              </DialogDescription>
            </DialogHeader>
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-8">
              {/* Project Details Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Project Details</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Project name"
                        className="col-span-3"
                        required
                        minLength={3}
                        maxLength={50}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Project description"
                        className="col-span-3"
                        maxLength={500}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Members Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Team Members</h3>
                  <p className="text-sm text-muted-foreground mb-4">Select team members and assign their roles.</p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {/* Available Users List */}
                  <div className="border rounded-md flex flex-col">
                    <div className="p-3 border-b bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium">Available Users</h4>
                        <span className="text-xs text-muted-foreground">
                          {filteredUsers.filter(user => !selectedUsers.some(selected => selected.user._id === user._id)).length} users
                        </span>
                      </div>
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div className="flex-1 overflow-y-auto h-[400px] p-2">
                      <div className="space-y-1">
                        {filteredUsers
                          .filter(user => !selectedUsers.some(selected => selected.user._id === user._id))
                          .sort((a, b) => a.userName.localeCompare(b.userName))
                          .map((user) => (
                            <button
                              key={user._id}
                              type="button"
                              onClick={() => handleSelectUser(user)}
                              className={cn(
                                "w-full flex items-start gap-2 p-3 text-left rounded-md",
                                "hover:bg-muted/50 transition-colors",
                                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                              )}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">{user.userName}</p>
                                <p className="text-muted-foreground text-xs truncate">
                                  {user.firstName} {user.lastName}
                                </p>
                              </div>
                              <PlusIcon className="h-5 w-5 shrink-0 opacity-50" />
                            </button>
                          ))}
                        {filteredUsers.length === 0 && (
                          <p className="text-sm text-muted-foreground p-2">
                            No users found
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Selected Users Table */}
                  <div className="border rounded-md flex flex-col">
                    <div className="p-3 border-b bg-muted/50">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Selected Team</h4>
                        <span className="text-xs text-muted-foreground">
                          {selectedUsers.length} selected
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedUsers
                            .sort((a, b) => a.user.userName.localeCompare(b.user.userName))
                            .map(({ user, role }) => (
                              <TableRow key={user._id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium text-sm">{user.userName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {user.firstName} {user.lastName}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={role}
                                    onValueChange={(value: string) =>
                                      handleRoleChange(user._id, value as ProjectRole)
                                    }
                                  >
                                    <SelectTrigger className="w-[160px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.values(ProjectRole).map((role) => (
                                        <SelectItem key={role} value={role}>
                                          {role.replace('_', ' ')}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveUser(user._id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          {selectedUsers.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-muted-foreground">
                                No team members selected
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t mt-auto">
            <DialogFooter className="w-full">
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 