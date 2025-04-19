"use client"

import { useState, Suspense } from "react" // Added Suspense import here just in case, might not be needed directly but good practice
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { verifyTwoFactorLogin } from "@/lib/actions/two-factor-actions"
import { useToast } from "@/components/ui/use-toast"
import { Shield, Key } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Renamed component
export default function VerifyTwoFactorClientContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [token, setToken] = useState("")
  const [recoveryCode, setRecoveryCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useRecovery, setUseRecovery] = useState(false)
  
  const fromUrl = searchParams.get("from") || "/dashboard"
  const userId = searchParams.get("userId") || ""
  
  // We might want to handle the redirect differently now that this isn't the main page export
  // Maybe return a loading state or null, letting the parent handle redirects if needed,
  // although the parent won't have userId without searchParams either.
  // For now, keeping the redirect logic. Consider refactoring if needed.
  if (!userId && typeof window !== 'undefined') { // Check for window to prevent SSR errors with router.push
    router.push("/login") 
    return null // Return null while redirecting
  }
  
  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    
    try {
      const verificationCode = useRecovery ? recoveryCode : token
      
      // Ensure userId is available before calling the action
      if (!userId) {
        setError("User ID is missing. Please log in again.")
        setIsLoading(false)
        return;
      }
      
      const result = await verifyTwoFactorLogin(verificationCode, userId)
      
      if ("error" in result) {
        setError(result.error.message)
      } else {
        toast({
          title: "Verification successful",
          description: "You have been successfully authenticated",
        })
        router.push(fromUrl)
        router.refresh() // Consider if refresh is still needed after push
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Render null if userId is missing and redirect is happening (client-side)
  if (!userId && typeof window !== 'undefined') {
    return null;
  }

  // Render loading or placeholder if userId is missing on initial server render pass
  if (!userId && typeof window === 'undefined') {
      return <div>Loading user context...</div>; // Or some placeholder
  }


  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Shield className="w-10 h-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Two-Factor Authentication</CardTitle>
          <CardDescription>
            Enter the verification code from your authenticator app
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleVerify}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {!useRecovery ? (
              <div className="space-y-2">
                <label htmlFor="token" className="block text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <Input
                  id="token"
                  name="token"
                  placeholder="Enter 6-digit code"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="text-center text-xl tracking-widest"
                  maxLength={6}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  autoFocus
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Open your authenticator app to view your verification code
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <label htmlFor="recoveryCode" className="block text-sm font-medium text-gray-700">
                  Recovery Code
                </label>
                <Input
                  id="recoveryCode"
                  name="recoveryCode"
                  placeholder="Enter recovery code"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                  className="text-center"
                  autoFocus
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Enter the recovery code you saved when setting up two-factor authentication
                </p>
              </div>
            )}
            
            <Button
              type="button" 
              variant="link" 
              className="px-0 mt-2 text-sm"
              onClick={() => setUseRecovery(!useRecovery)}
              disabled={isLoading} // Disable button while loading
            >
              {useRecovery 
                ? "Use verification code instead" 
                : "Use recovery code instead"
              }
            </Button>
          </CardContent>
          
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full flex items-center gap-2" 
              disabled={isLoading || (!useRecovery && token.length !== 6) || (useRecovery && !recoveryCode)} // More robust disable logic
            >
              <Key size={16} />
              {isLoading ? "Verifying..." : "Verify"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 