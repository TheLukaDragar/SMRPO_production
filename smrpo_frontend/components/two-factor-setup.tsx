"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { User } from "@/lib/types/user-types"
import { setupTwoFactor, verifyAndActivateTwoFactor, disableTwoFactor } from "@/lib/actions/two-factor-actions"
import { useToast } from "@/components/ui/use-toast"
import { Shield, AlertTriangle, Check, Copy, Smartphone, LockKeyhole } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"

interface TwoFactorSetupProps {
  user: User;
  onSetupComplete: () => void;
}

export function TwoFactorSetup({ user, onSetupComplete }: TwoFactorSetupProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [setupData, setSetupData] = useState<{ qrCodeUrl: string; secret: string; recoveryCode?: string } | null>(null);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"initial" | "setup" | "verify">("initial");
  const [disablePassword, setDisablePassword] = useState("");
  const [isDisabling, setIsDisabling] = useState(false);

  const startSetup = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await setupTwoFactor(user._id);
      if ("error" in result) {
        setError(result.error.message);
      } else {
        setSetupData(result);
        setStep("setup");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndEnable = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await verifyAndActivateTwoFactor(user._id, token);
      if ("error" in result) {
        setError(result.error.message);
      } else {
        toast({
          title: "Two-factor authentication enabled",
          description: "Your account is now more secure.",
        });
        onSetupComplete();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsDisabling(true);
    setError(null);

    try {
      const result = await disableTwoFactor(user._id, disablePassword);
      if ("error" in result) {
        setError(result.error.message);
      } else {
        toast({
          title: "Two-factor authentication disabled",
          description: "Two-factor authentication has been turned off for your account.",
        });
        onSetupComplete();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsDisabling(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} copied`,
      description: `The ${label.toLowerCase()} has been copied to your clipboard.`,
    });
  };

  // Render the appropriate content based on 2FA status and setup step
  if (user.twoFactorEnabled) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium">Two-Factor Authentication</CardTitle>
            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs">
              <Check size={14} />
              <span>Enabled</span>
            </div>
          </div>
          <CardDescription>
            Your account is protected with two-factor authentication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-600">
              If you disable two-factor authentication, your account will be less secure.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleDisable} className="mt-4 space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <label htmlFor="disablePassword" className="block text-sm font-medium">
                Current Password
              </label>
              <Input
                id="disablePassword"
                name="disablePassword"
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Enter your current password"
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter your password to confirm you want to disable two-factor authentication.
              </p>
            </div>
            
            <Button 
              type="submit" 
              variant="destructive" 
              className="w-full"
              disabled={isDisabling}
            >
              {isDisabling ? "Disabling..." : "Disable Two-Factor Authentication"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (step === "initial") {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium">Two-Factor Authentication</CardTitle>
            <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs">
              <AlertTriangle size={14} />
              <span>Not Enabled</span>
            </div>
          </div>
          <CardDescription>
            Add an extra layer of security to your account by enabling two-factor authentication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-2 rounded-full">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Enhanced Security</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Two-factor authentication adds an additional layer of security by requiring 
                a code from your phone in addition to your password.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-2 rounded-full">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Authenticator App</h3>
              <p className="text-xs text-muted-foreground mt-1">
                You&apos;ll need an authenticator app like Google Authenticator, Microsoft Authenticator, 
                or Authy to use two-factor authentication.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-2 rounded-full">
              <LockKeyhole className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Recovery Codes</h3>
              <p className="text-xs text-muted-foreground mt-1">
                You&apos;ll get a recovery code to use if you lose access to your authenticator app.
                Save it in a secure place.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={startSetup}
            disabled={isLoading}
          >
            {isLoading ? "Setting up..." : "Set Up Two-Factor Authentication"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (step === "setup" && setupData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Set Up Two-Factor Authentication</CardTitle>
          <CardDescription>
            Scan the QR code with your authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-white p-2 rounded-lg border">
              <Image 
                src={setupData.qrCodeUrl} 
                alt="QR Code for authenticator app"
                width={200}
                height={200}
                className="mx-auto"
              />
            </div>
            
            <div className="space-y-2 w-full">
              <label className="block text-sm font-medium text-gray-700">
                Secret Key (if you can&apos;t scan the QR code)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={setupData.secret}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={() => copyToClipboard(setupData.secret, "Secret key")}
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>
            
            {setupData.recoveryCode && (
              <div className="space-y-2 w-full">
                <label className="block text-sm font-medium text-gray-700">
                  Recovery Code (save this somewhere safe)
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={setupData.recoveryCode}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(setupData.recoveryCode!, "Recovery code")}
                  >
                    <Copy size={16} />
                  </Button>
                </div>
                <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                  <AlertTriangle size={12} />
                  Save this recovery code in a secure place. You will need it if you lose access to your authenticator app.
                </p>
              </div>
            )}
          </div>
          
          <Button 
            className="w-full" 
            onClick={() => setStep("verify")}
          >
            Continue to Verification
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "verify") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verify Two-Factor Authentication</CardTitle>
          <CardDescription>
            Enter the verification code from your authenticator app to complete setup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={verifyAndEnable} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <label htmlFor="token" className="block text-sm font-medium">
                Verification Code
              </label>
              <Input
                id="token"
                name="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter 6-digit code"
                className="text-center text-xl tracking-widest"
                maxLength={6}
                autoComplete="one-time-code"
                inputMode="numeric"
                required
              />
              <p className="text-xs text-muted-foreground">
                Open your authenticator app to view your verification code
              </p>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => setStep("setup")}
              >
                Back
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Enable Two-Factor Authentication"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return null;
} 