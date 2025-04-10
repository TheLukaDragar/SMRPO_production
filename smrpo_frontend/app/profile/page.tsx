"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/lib/hooks/useUser"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { updateUser, User } from "@/lib/actions/user-actions"
import { useToast } from "@/components/ui/use-toast"
import { Eye, EyeOff, User as UserIcon, Mail, Key, Save, Pencil, X, Check, Shield, AlertTriangle, Copy, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PasswordStrengthMeter } from "@/components/password-strength-meter"
import { setupTwoFactor, verifyAndActivateTwoFactor, disableTwoFactor } from "@/lib/actions/two-factor-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function ProfilePage() {
  const { user, mutateUser } = useUser()
  const router = useRouter()
  const { toast } = useToast()

  // State for user data
  const [userData, setUserData] = useState({
    userName: user?.userName || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
  })

  // State for tracking which fields are being edited
  const [editableFields, setEditableFields] = useState({
    userName: false,
    firstName: false,
    lastName: false,
    email: false,
    password: false,
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [revealLastChar, setRevealLastChar] = useState(true)

  // 2FA states
  const [twoFactorSetupData, setTwoFactorSetupData] = useState<{
    qrCodeUrl: string;
    secret: string;
    otpauthUrl: string;
  } | null>(null)
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [recoveryCode, setRecoveryCode] = useState("")
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false)
  const [disablePasswordInput, setDisablePasswordInput] = useState("")
  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null)
  const [isTwoFactorLoading, setIsTwoFactorLoading] = useState(false)

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "Administrator":
        return "destructive"
      case "Developer":
        return "default"
      default:
        return "secondary"
    }
  }

  // Get masked password for display (show last character if enabled)
  const getMaskedPassword = (password: string, showPassword: boolean) => {
    if (showPassword) return password
    if (password.length === 0) return ""
    
    // Always reveal last character if revealLastChar is true and password is long enough
    if (revealLastChar && password.length > 1) {
      const maskedPart = "•".repeat(password.length - 1)
      return maskedPart + password.charAt(password.length - 1)
    }
    
    return "•".repeat(password.length)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setUserData({ ...userData, [name]: value })
  }

  // Toggle edit mode for a field
  const toggleEdit = (field: keyof typeof editableFields) => {
    // If we're canceling an edit, revert to original value
    if (editableFields[field]) {
      setUserData({
        ...userData,
        [field]: user?.[field as keyof User] as string || ""
      })
    }
    
    setEditableFields({
      ...editableFields,
      [field]: !editableFields[field]
    })
  }

  // Handle individual field update
  const handleFieldUpdate = async (field: keyof User) => {
    if (!user) return

    setIsSubmitting(true)
    
    try {
      const updatedField = userData[field as keyof typeof userData]
      
      // Only update if value has changed
      if (updatedField === user[field]) {
        toggleEdit(field as keyof typeof editableFields)
        return
      }
      
      const updateData: Partial<User> = { [field]: updatedField }
      
      const result = await updateUser(user._id, updateData)

      if ("error" in result) {
        toast({
          variant: "destructive",
          title: "Error updating field",
          description: result.error.message,
        })
      } else {
        toast({
          title: "Field updated",
          description: `Your ${field} has been updated successfully`,
        })
        
        // Exit edit mode
        toggleEdit(field as keyof typeof editableFields)
        
        // Refresh user data
        mutateUser()
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

  // Handle password update
  const handlePasswordUpdate = async () => {
    if (!user) return

    setIsSubmitting(true)
    
    try {
      if (!userData.newPassword) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "New password is required",
        })
        setIsSubmitting(false)
        return
      }
      
      if (!userData.currentPassword) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Current password is required to set a new password",
        })
        setIsSubmitting(false)
        return
      }
      
      const updateData: Partial<User> = {
        password: userData.newPassword,
        currentPassword: userData.currentPassword
      }
      
      const result = await updateUser(user._id, updateData)

      if ("error" in result) {
        toast({
          variant: "destructive",
          title: "Error updating password",
          description: result.error.message,
        })
      } else {
        toast({
          title: "Password updated",
          description: "Your password has been updated successfully",
        })
        
        // Clear password fields after successful update
        setUserData({
          ...userData,
          currentPassword: "",
          newPassword: "",
        })
        
        // Exit edit mode
        toggleEdit('password')
        
        // Refresh user data
        mutateUser()
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

  // 2FA Functions
  // Initialize 2FA setup
  const handleSetupTwoFactor = async () => {
    if (!user) return
    
    setIsTwoFactorLoading(true)
    setTwoFactorError(null)
    
    try {
      const result = await setupTwoFactor(user._id)
      
      if ("error" in result) {
        setTwoFactorError(result.error.message)
      } else {
        setTwoFactorSetupData(result)
      }
    } catch (error: any) {
      setTwoFactorError(error.message || "An unexpected error occurred")
    } finally {
      setIsTwoFactorLoading(false)
    }
  }
  
  // Verify and activate 2FA
  const handleVerifyTwoFactor = async () => {
    if (!user) return
    
    setIsTwoFactorLoading(true)
    setTwoFactorError(null)
    
    try {
      if (!twoFactorCode) {
        setTwoFactorError("Verification code is required")
        setIsTwoFactorLoading(false)
        return
      }
      
      const result = await verifyAndActivateTwoFactor(user._id, twoFactorCode)
      
      if ("error" in result) {
        setTwoFactorError(result.error.message)
      } else {
        setRecoveryCode(result.recoveryCode)
        setShowRecoveryDialog(true)
        setTwoFactorSetupData(null)
        setTwoFactorCode("")
        
        // Refresh user data
        mutateUser()
        
        toast({
          title: "Two-factor authentication enabled",
          description: "Your account is now more secure",
        })
      }
    } catch (error: any) {
      setTwoFactorError(error.message || "An unexpected error occurred")
    } finally {
      setIsTwoFactorLoading(false)
    }
  }
  
  // Disable 2FA
  const handleDisableTwoFactor = async () => {
    if (!user) return
    
    setIsTwoFactorLoading(true)
    setTwoFactorError(null)
    
    try {
      if (!disablePasswordInput) {
        setTwoFactorError("Password is required to disable 2FA")
        setIsTwoFactorLoading(false)
        return
      }
      
      const result = await disableTwoFactor(user._id, disablePasswordInput)
      
      if ("error" in result) {
        setTwoFactorError(result.error.message)
      } else {
        setShowDisableDialog(false)
        setDisablePasswordInput("")
        
        // Refresh user data
        mutateUser()
        
        toast({
          title: "Two-factor authentication disabled",
          description: "2FA has been turned off for your account",
        })
      }
    } catch (error: any) {
      setTwoFactorError(error.message || "An unexpected error occurred")
    } finally {
      setIsTwoFactorLoading(false)
    }
  }
  
  // Copy recovery code to clipboard
  const copyRecoveryCode = () => {
    navigator.clipboard.writeText(recoveryCode)
    toast({
      title: "Recovery code copied",
      description: "Store this code in a safe place",
    })
  }

  // Complete profile update (for compatibility)
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Build an object with updated user fields.
      const updatedUserData: Partial<User> = {}
      
      // Only add fields that have changed
      if (userData.userName !== user?.userName) updatedUserData.userName = userData.userName
      if (userData.firstName !== user?.firstName) updatedUserData.firstName = userData.firstName
      if (userData.lastName !== user?.lastName) updatedUserData.lastName = userData.lastName
      if (userData.email !== user?.email) updatedUserData.email = userData.email
      
      // Only update password if a new one is provided.
      if (userData.newPassword) {
        // Require current password when changing to new password
        if (!userData.currentPassword) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Current password is required to set a new password",
          })
          setIsSubmitting(false)
          return
        }
        
        updatedUserData.password = userData.newPassword
        updatedUserData.currentPassword = userData.currentPassword
      }

      // Only proceed if there are changes
      if (Object.keys(updatedUserData).length === 0) {
        toast({
          title: "No changes",
          description: "No changes were detected to update",
        })
        setIsSubmitting(false)
        return
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
          title: "Profile updated",
          description: "Your profile has been updated successfully",
        })
        // Clear password fields after successful update
        setUserData({
          ...userData,
          currentPassword: "",
          newPassword: "",
        })
        
        // Refresh user data
        mutateUser()
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

  if (!user) {
    return (
      <div className="container mx-auto p-8 flex justify-center items-center min-h-[70vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Loading Profile</CardTitle>
            <CardDescription>Please wait while we load your profile information...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Editable field with inline edit capability
  const EditableField = ({ 
    label, 
    name, 
    value, 
    icon 
  }: { 
    label: string; 
    name: keyof typeof editableFields; 
    value: string;
    icon?: React.ReactNode;
  }) => {
    const isEditing = editableFields[name];
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor={name}>{label}</Label>
          {!isEditing ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => toggleEdit(name)}
              aria-label={`Edit ${label}`}
            >
              <Pencil size={16} />
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-600"
                onClick={() => handleFieldUpdate(name as keyof User)}
                disabled={isSubmitting}
                aria-label={`Save ${label}`}
              >
                <Check size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600"
                onClick={() => toggleEdit(name)}
                aria-label={`Cancel editing ${label}`}
              >
                <X size={16} />
              </Button>
            </div>
          )}
        </div>
        {isEditing ? (
          <div className="flex">
            {icon && <span className="flex items-center mr-2 text-muted-foreground">{icon}</span>}
            <Input
              id={name}
              name={name}
              value={userData[name as keyof typeof userData] as string}
              onChange={handleChange}
              placeholder={`Enter your ${label.toLowerCase()}`}
              autoFocus
            />
          </div>
        ) : (
          <div className="flex items-center p-2 rounded-md bg-muted/50">
            {icon && <span className="mr-2 text-muted-foreground">{icon}</span>}
            <span>{value}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserIcon size={48} className="text-primary" />
                </div>
              </div>
              <CardTitle>{user.firstName} {user.lastName}</CardTitle>
              <CardDescription className="flex justify-center mt-1">
                <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <UserIcon size={16} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">@{user.userName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield size={16} className={user.twoFactorEnabled ? "text-green-500" : "text-muted-foreground"} />
                  <span className="text-sm text-muted-foreground">
                    {user.twoFactorEnabled ? "2FA Enabled" : "2FA Not Enabled"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-2/3">
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>Update your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <EditableField 
                    label="First Name" 
                    name="firstName" 
                    value={user.firstName} 
                    icon={<UserIcon size={16} />} 
                  />
                  <EditableField 
                    label="Last Name" 
                    name="lastName" 
                    value={user.lastName} 
                    icon={<UserIcon size={16} />} 
                  />
                </div>
                
                <EditableField 
                  label="Username" 
                  name="userName" 
                  value={user.userName} 
                  icon={<UserIcon size={16} />} 
                />
                
                <EditableField 
                  label="Email" 
                  name="email" 
                  value={user.email} 
                  icon={<Mail size={16} />} 
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Key size={18} />
                      Change Password
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Update your password
                    </p>
                  </div>
                  <div>
                    {!editableFields.password ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleEdit('password')}
                        className="flex items-center gap-1"
                      >
                        <Pencil size={14} />
                        Change
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleEdit('password')}
                        className="flex items-center gap-1 text-red-600"
                      >
                        <X size={14} />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
                
                {editableFields.password && (
                  <div className="space-y-4 bg-muted/30 p-4 rounded-md">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          name="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={userData.currentPassword}
                          onChange={handleChange}
                          placeholder="Enter your current password"
                          className="pr-10"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                        >
                          {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={userData.newPassword}
                          onChange={handleChange}
                          placeholder="Enter your new password"
                          className="pr-10"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                        >
                          {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      
                      {/* Password Strength Meter */}
                      <PasswordStrengthMeter password={userData.newPassword} />
                      
                      {userData.newPassword && !showNewPassword && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Your password: {getMaskedPassword(userData.newPassword, false)}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="revealLastChar"
                        checked={revealLastChar}
                        onChange={(e) => setRevealLastChar(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="revealLastChar" className="text-sm cursor-pointer">
                        Show last character of password when typing
                      </Label>
                    </div>
                    
                    <Button 
                      onClick={handlePasswordUpdate} 
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Two-Factor Authentication Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Shield size={18} />
                      Two-Factor Authentication
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <div>
                    {!user.twoFactorEnabled ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSetupTwoFactor}
                        className="flex items-center gap-1"
                        disabled={isTwoFactorLoading}
                      >
                        <Shield size={14} />
                        {isTwoFactorLoading ? "Loading..." : "Enable"}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDisableDialog(true)}
                        className="flex items-center gap-1 text-red-600"
                      >
                        <X size={14} />
                        Disable
                      </Button>
                    )}
                  </div>
                </div>

                {twoFactorError && (
                  <Alert variant="destructive">
                    <AlertDescription>{twoFactorError}</AlertDescription>
                  </Alert>
                )}

                {/* 2FA status info */}
                {!twoFactorSetupData && (
                  <div className="bg-muted/30 p-4 rounded-md">
                    <div className="flex items-center gap-3 mb-2">
                      {user.twoFactorEnabled ? (
                        <>
                          <Shield className="h-8 w-8 text-green-500" />
                          <div>
                            <h4 className="font-medium">Two-factor authentication is enabled</h4>
                            <p className="text-sm text-muted-foreground">Your account has an extra layer of security</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <Shield className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <h4 className="font-medium">Two-factor authentication is not enabled</h4>
                            <p className="text-sm text-muted-foreground">Enable 2FA to better protect your account</p>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">What is two-factor authentication?</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Two-factor authentication adds an extra layer of security to your account by requiring a code from your phone in addition to your password.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        You'll need an authenticator app like Google Authenticator, Microsoft Authenticator, or Authy to use this feature.
                      </p>
                    </div>
                  </div>
                )}

                {/* 2FA Setup UI */}
                {twoFactorSetupData && (
                  <div className="space-y-4 bg-muted/30 p-4 rounded-md">
                    <h4 className="font-medium">Set up two-factor authentication</h4>
                    
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        <p className="mb-2">1. Scan this QR code with your authenticator app</p>
                        <div className="flex justify-center my-4 bg-white p-4 rounded-md max-w-[200px] mx-auto">
                          {twoFactorSetupData.qrCodeUrl && (
                            <img 
                              src={twoFactorSetupData.qrCodeUrl} 
                              alt="QR Code for 2FA" 
                              width={200}
                              height={200}
                            />
                          )}
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <p className="mb-2">2. Or manually enter this code in your authenticator app:</p>
                        <div className="flex items-center justify-center gap-2 my-2">
                          <code className="bg-gray-100 p-2 rounded text-center font-mono">
                            {twoFactorSetupData.secret}
                          </code>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              navigator.clipboard.writeText(twoFactorSetupData.secret)
                              toast({
                                title: "Secret copied",
                                description: "Secret has been copied to your clipboard",
                              })
                            }}
                          >
                            <Copy size={16} />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <p className="mb-2">3. Enter the 6-digit code from your authenticator app:</p>
                        <Input 
                          value={twoFactorCode}
                          onChange={(e) => setTwoFactorCode(e.target.value)}
                          placeholder="Enter 6-digit code"
                          className="text-center text-lg tracking-widest"
                          maxLength={6}
                          inputMode="numeric"
                        />
                      </div>
                      
                      <div className="flex justify-between gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => setTwoFactorSetupData(null)}
                          disabled={isTwoFactorLoading}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleVerifyTwoFactor}
                          disabled={isTwoFactorLoading || twoFactorCode.length !== 6}
                        >
                          {isTwoFactorLoading ? "Verifying..." : "Verify and Enable"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recovery Code Dialog */}
      <Dialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-yellow-500" />
              Save Your Recovery Code
            </DialogTitle>
            <DialogDescription>
              Store this recovery code in a safe place. You'll need it if you lose access to your authentication app.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-4">
            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-md w-full text-center mb-4">
              <code className="font-mono text-lg">{recoveryCode}</code>
            </div>
            
            <div className="text-sm text-muted-foreground text-center">
              <p className="mb-2">
                <strong>Important:</strong> This code will only be shown once.
              </p>
              <p>
                If you lose both your authenticator device and this recovery code,
                you will be locked out of your account.
              </p>
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={copyRecoveryCode}
              className="flex items-center gap-1 mt-2 sm:mt-0"
            >
              <Copy size={14} />
              Copy Code
            </Button>
            
            <Button
              size="sm"
              onClick={() => setShowRecoveryDialog(false)}
              className="mt-2 sm:mt-0"
            >
              I've Saved My Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" />
              Disable Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              This will make your account less secure. Please confirm your password to continue.
            </DialogDescription>
          </DialogHeader>
          
          {twoFactorError && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>{twoFactorError}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col py-4">
            <div className="space-y-2">
              <Label htmlFor="disablePassword">Your Password</Label>
              <Input
                id="disablePassword"
                type="password"
                value={disablePasswordInput}
                onChange={(e) => setDisablePasswordInput(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDisableDialog(false)
                setDisablePasswordInput("")
                setTwoFactorError(null)
              }}
              disabled={isTwoFactorLoading}
            >
              Cancel
            </Button>
            
            <Button
              variant="destructive"
              onClick={handleDisableTwoFactor}
              disabled={isTwoFactorLoading || !disablePasswordInput}
            >
              {isTwoFactorLoading ? "Disabling..." : "Disable 2FA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}