import React from 'react';
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

type PasswordStrengthLevel = 'weak' | 'medium' | 'strong' | 'very-strong';

interface PasswordRequirement {
  label: string;
  isMet: boolean;
}

interface PasswordStrengthMeterProps {
  password: string;
  showDetails?: boolean;
}

export function calculatePasswordStrength(password: string): {
  strength: PasswordStrengthLevel;
  requirements: PasswordRequirement[];
  score: number; // 0-100 score
} {
  // Initialize requirements
  const requirements: PasswordRequirement[] = [
    { label: 'At least 12 characters', isMet: password.length >= 12 },
    { label: 'Contains lowercase letters', isMet: /[a-z]/.test(password) },
    { label: 'Contains uppercase letters', isMet: /[A-Z]/.test(password) },
    { label: 'Contains numbers', isMet: /[0-9]/.test(password) },
    { label: 'Contains special characters', isMet: /[^A-Za-z0-9]/.test(password) },
  ];

  // Calculate how many requirements are met
  const metRequirements = requirements.filter(req => req.isMet).length;
  
  // Calculate score (0-100)
  let score = 0;
  
  // Length contributes up to 40 points
  const lengthScore = Math.min(40, Math.floor((password.length / 20) * 40));
  score += lengthScore;
  
  // Each requirement contributes up to 15 points (total 60)
  score += Math.floor((metRequirements / requirements.length) * 60);
  
  // Cap score at 100
  score = Math.min(100, score);
  
  // Determine strength level
  let strength: PasswordStrengthLevel = 'weak';
  if (score >= 90) strength = 'very-strong';
  else if (score >= 70) strength = 'strong';
  else if (score >= 40) strength = 'medium';
  
  return { strength, requirements, score };
}

export function PasswordStrengthMeter({ password, showDetails = true }: PasswordStrengthMeterProps) {
  const { strength, requirements, score } = calculatePasswordStrength(password);
  
  // Colors for different strength levels
  const strengthColors = {
    'weak': 'bg-red-500',
    'medium': 'bg-yellow-500',
    'strong': 'bg-green-500',
    'very-strong': 'bg-emerald-500'
  };
  
  // Text for different strength levels
  const strengthText = {
    'weak': 'Weak',
    'medium': 'Medium',
    'strong': 'Strong',
    'very-strong': 'Very Strong'
  };
  
  // Icons for different strength levels
  const strengthIcon = {
    'weak': <XCircle className="h-4 w-4 text-red-500" />,
    'medium': <AlertCircle className="h-4 w-4 text-yellow-500" />,
    'strong': <CheckCircle className="h-4 w-4 text-green-500" />,
    'very-strong': <CheckCircle className="h-4 w-4 text-emerald-500" />
  };
  
  // Don't show anything if password is empty
  if (!password) {
    return null;
  }
  
  return (
    <div className="space-y-2 mt-2">
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${strengthColors[strength]} transition-all duration-300 ease-in-out`}
          style={{ width: `${score}%` }}
        />
      </div>
      
      {/* Strength text */}
      <div className="flex items-center gap-1.5">
        {strengthIcon[strength]}
        <span className="text-sm font-medium">
          Password strength: <span className={`font-semibold ${strength === 'weak' ? 'text-red-500' : strength === 'medium' ? 'text-yellow-500' : 'text-green-500'}`}>
            {strengthText[strength]}
          </span>
        </span>
      </div>
      
      {/* Requirements list - only show if showDetails is true */}
      {showDetails && (
        <div className="text-sm space-y-1 mt-2">
          <p className="text-muted-foreground flex items-center gap-1">
            <Info className="h-3.5 w-3.5" />
            <span>Your password should include:</span>
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-1">
            {requirements.map((req, index) => (
              <li key={index} className="flex items-center gap-1.5">
                <span className={req.isMet ? "text-green-500" : "text-muted-foreground"}>
                  {req.isMet ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                </span>
                <span className={`text-xs ${req.isMet ? "text-green-500" : "text-muted-foreground"}`}>
                  {req.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Simplified version for login/registration pages
export function SimplePasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { strength, score } = calculatePasswordStrength(password);
  
  // Colors for different strength levels
  const strengthColors = {
    'weak': 'bg-red-500',
    'medium': 'bg-yellow-500',
    'strong': 'bg-green-500',
    'very-strong': 'bg-emerald-500'
  };
  
  // Don't show anything if password is empty
  if (!password) {
    return null;
  }
  
  return (
    <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden mt-1">
      <div 
        className={`h-full ${strengthColors[strength]} transition-all duration-300 ease-in-out`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
} 