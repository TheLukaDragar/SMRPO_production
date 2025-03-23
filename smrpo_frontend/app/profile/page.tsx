//// filepath: c:\Users\user\Documents\GitHub\Faks FRI\SMRPO\SMRPO\smrpo_frontend\app\profile\page.tsx
"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/lib/hooks/useUser"
import { Button } from "@/components/ui/button"
import { updateUser, User } from "@/lib/actions/user-actions"
import { useToast } from "@/components/ui/use-toast"

export default function ProfilePage() {
  const { user } = useUser()
  const router = useRouter()
  const { toast } = useToast()

  const [userName, setUserName] = useState(user?.userName || "")
  const [firstName, setFirstName] = useState(user?.firstName || "")
  const [lastName, setLastName] = useState(user?.lastName || "")
  const [email, setEmail] = useState(user?.email || "")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Build an object with updated user fields.
      const updatedUserData: Partial<User> = {
        userName,
        firstName,
        lastName,
        email,
      }
      // Only update password if a new one is provided.
      if (password) {
        updatedUserData.password = password
      }

      const result = await updateUser(user!._id, updatedUserData)

      if ("error" in result) {
        toast({
          variant: "destructive",
          title: "Error updating profile",
          description: result.error.message,
        })
      } else {
        toast({
          variant: "success",
          title: "Success",
          description: "Profile updated successfully",
        })
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An unexpected error occurred",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Username"
          className="input"
        />
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First Name"
          className="input"
        />
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last Name"
          className="input"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="input"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New Password (leave empty to keep current)"
          className="input"
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update Profile"}
        </Button>
      </form>
    </div>
  )
}
