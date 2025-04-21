"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { addProjectMember } from "@/lib/actions/project-actions"
import { searchUsers } from "@/lib/actions/user-actions"
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
import { ProjectRole } from "@/lib/types/project-types"
import { User } from "@/lib/types/user-types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { InfoIcon } from "lucide-react"

interface AddTeamMemberDialogProps {
  projectId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  onAddMember?: (userId: string, role: ProjectRole) => void;
}

export function AddTeamMemberDialog({ 
  projectId,
  open: externalOpen, 
  onOpenChange: externalOnOpenChange, 
  trigger,
  onSuccess,
  onAddMember
}: AddTeamMemberDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<{ user: User; role: ProjectRole } | null>(null)
  const [userPopoverOpen, setUserPopoverOpen] = useState(false)
  const { toast } = useToast()
  
  // Determine if we're using external or internal state control
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = isControlled 
    ? (newOpen: boolean) => externalOnOpenChange?.(newOpen) 
    : setInternalOpen;

  // Load initial users when component mounts
  useEffect(() => {
    const loadUsers = async () => {
      const results = await searchUsers(" ")
      setUsers(results)
    }
    loadUsers()
  }, [])

  // Handle search updates
  useEffect(() => {
    const searchUsersDebounced = setTimeout(async () => {
      if (searchQuery) {
        const results = await searchUsers(searchQuery)
        setUsers(results)
      }
    }, 300)

    return () => clearTimeout(searchUsersDebounced)
  }, [searchQuery])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (!selectedUser) {
        throw new Error("Please select a user")
      }
      
      // If onAddMember prop is provided, use it instead of server call
      if (onAddMember) {
        onAddMember(selectedUser.user._id, selectedUser.role);
        
        // Reset dialog state
        setSelectedUser(null)
        setSearchQuery("")
        setOpen(false)
        return;
      }
      
      // Otherwise use server-side call
      console.log(selectedUser)
      console.log(projectId)

      const result = await addProjectMember(projectId, selectedUser.user._id, selectedUser.role)

      if ('error' in result) {
        setError(result.error.message)
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error.message,
        })
      } else {
        toast({
          variant: "success",
          title: "Success",
          description: "Team member added successfully",
        })
        
        // Reset dialog state
        setSelectedUser(null)
        setSearchQuery("")
        setOpen(false)
        onSuccess?.()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectUser = (user: User) => {
    setSelectedUser({ user, role: ProjectRole.DEVELOPER })
    setUserPopoverOpen(false)
    setSearchQuery("")
  }

  const handleRoleChange = (role: ProjectRole) => {
    if (selectedUser) {
      setSelectedUser({ ...selectedUser, role })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a new member to your project team.
            </DialogDescription>
          </DialogHeader>

          {/* Role constraints info */}
          <div className="mt-4 p-3 border rounded-md bg-blue-50/50 flex gap-2 items-start">
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

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                  >
                    {selectedUser ? `${selectedUser.user.firstName} ${selectedUser.user.lastName}` : "Select a user..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search users..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>No users found.</CommandEmpty>
                      <CommandGroup>
                        {users.map((user) => (
                          <CommandItem
                            key={user._id}
                            value={user.userName}
                            onSelect={() => handleSelectUser(user)}
                          >
                            {user.userName} ({user.firstName} {user.lastName})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {selectedUser && (
                <Select
                  value={selectedUser.role}
                  onValueChange={(value: string) => handleRoleChange(value as ProjectRole)}
                >
                  <SelectTrigger className="w-full">
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
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || !selectedUser}>
              {isSubmitting ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 