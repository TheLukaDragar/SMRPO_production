'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { register } from "@/lib/actions/auth-actions"
import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ErrorResponse } from "@/lib/utils/error-handling"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserRole } from '@/lib/types/user-types';

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const [error, setError] = useState<ErrorResponse['error'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getFieldError = (fieldName: string) => {
    if (!error?.validationErrors) return null;
    const fieldError = error.validationErrors.find(err => err.field === fieldName);
    return fieldError?.message;
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const result = await register(formData);

      if ('error' in result) {
        const errorResponse = result as ErrorResponse;
        setError(errorResponse.error);
      } else {
        router.push('/login?registered=true');
        router.refresh();
      }
    } catch (err) {
      setError({
        message: 'An unexpected error occurred. Please try again.',
        type: 'UnknownError',
        statusCode: 500
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your information below to create your account
        </p>
      </div>
      {error && !error.validationErrors && (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="userName">Username</Label>
          <Input 
            id="userName" 
            name="userName" 
            type="text"
            placeholder="johndoe"
            required 
            disabled={isLoading}
          />
          {getFieldError('userName') && (
            <p className="text-sm text-destructive">{getFieldError('userName')}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-3">
            <Label htmlFor="firstName">First Name</Label>
            <Input 
              id="firstName" 
              name="firstName" 
              type="text"
              placeholder="John"
              required 
              disabled={isLoading}
            />
            {getFieldError('firstName') && (
              <p className="text-sm text-destructive">{getFieldError('firstName')}</p>
            )}
          </div>
          <div className="grid gap-3">
            <Label htmlFor="lastName">Last Name</Label>
            <Input 
              id="lastName" 
              name="lastName" 
              type="text"
              placeholder="Doe"
              required 
              disabled={isLoading}
            />
            {getFieldError('lastName') && (
              <p className="text-sm text-destructive">{getFieldError('lastName')}</p>
            )}
          </div>
        </div>
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            placeholder="john@example.com" 
            required 
            disabled={isLoading}
          />
          {getFieldError('email') && (
            <p className="text-sm text-destructive">{getFieldError('email')}</p>
          )}
        </div>
        <div className="grid gap-3">
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password" 
            name="password" 
            type="password"
            placeholder="••••••••" 
            required 
            disabled={isLoading}
          />
          {getFieldError('password') && (
            <p className="text-sm text-destructive">{getFieldError('password')}</p>
          )}
        </div>
        <div className="grid gap-3">
          <Label htmlFor="role">Role</Label>
          <Select name="role" required disabled={isLoading}>
            <SelectTrigger>
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UserRole.DEVELOPER}>Developer</SelectItem>
              <SelectItem value={UserRole.ADMINISTRATOR}>Administrator</SelectItem>
            </SelectContent>
          </Select>
          {getFieldError('role') && (
            <p className="text-sm text-destructive">{getFieldError('role')}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Create account"}
        </Button>
      </div>
      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="underline underline-offset-4">
          Sign in
        </Link>
      </div>
    </form>
  )
} 