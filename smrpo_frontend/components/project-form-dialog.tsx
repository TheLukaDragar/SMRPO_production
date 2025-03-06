"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { handleAddProject } from "@/lib/actions/project-actions"
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
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([])
  const [userPopoverOpen, setUserPopoverOpen] = useState(false)
  const { toast } = useToast()
  
  // Determine if we're using external or internal state control
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = isControlled 
    ? (newOpen: boolean) => externalOnOpenChange?.(newOpen) 
    : setInternalOpen;

  useEffect(() => {
    const searchUsersDebounced = setTimeout(async () => {
      if (searchQuery.length >= 1) {
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
        toast({
          variant: "success",
          title: "Success",
          description: "Project created successfully",
        })
        
        setOpen(false)
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectUser = (user: User) => {
    if (!selectedUsers.some(selected => selected.user._id === user._id)) {
      setSelectedUsers([...selectedUsers, { user, role: ProjectRole.DEVELOPER }])
    }
    setUserPopoverOpen(false)
    setSearchQuery("")
  }

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(selected => selected.user._id !== userId))
  }

  const handleRoleChange = (userId: string, role: ProjectRole) => {
    setSelectedUsers(selectedUsers.map(selected => 
      selected.user._id === userId ? { ...selected, role } : selected
    ))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
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
          <div className="grid gap-4 py-4">
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
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right mt-3">
                Members
              </Label>
              <div className="col-span-3 space-y-4">
                <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                    >
                      Add team members...
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
                <div className="space-y-2">
                  {selectedUsers.map(({ user, role }) => (
                    <div
                      key={user._id}
                      className="flex items-center gap-2 rounded-md border p-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.userName}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {user.firstName} {user.lastName}
                        </p>
                      </div>
                      <Select
                        value={role}
                        onValueChange={(value: string) => handleRoleChange(user._id, value as ProjectRole)}
                      >
                        <SelectTrigger className="w-[140px]">
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveUser(user._id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 