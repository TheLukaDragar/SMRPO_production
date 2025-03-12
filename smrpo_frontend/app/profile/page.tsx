'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/hooks/useUser'
import { Button } from '@/components/ui/button'

export default function ProfilePage() {
  const { user } = useUser()
  const router = useRouter()

  const [userName, setUserName] = useState(user?.userName || '')
  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData()
    formData.append('userName', userName)
    formData.append('firstName', firstName)
    formData.append('lastName', lastName)
    formData.append('email', email)
    if (password) {
      formData.append('password', password)
    }

    try {
      const res = await fetch('/api/update-user', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        throw new Error('Failed to update profile')
      }
      setMessage('Profile updated successfully!')
      router.refresh()
    } catch (error) {
      setMessage('An error occurred. Please try again.')
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
        <Button type="submit">Update Profile</Button>
        {message && <p>{message}</p>}
      </form>
    </div>
  )
}