import { authenticator } from 'otplib';
import QRCode from 'qrcode';

// Service name that will appear in authenticator apps
const SERVICE_NAME = 'SMRPO Application';

export interface TwoFactorSetupData {
  secret: string;
  qrCodeUrl: string;
  recoveryCode?: string;
}

/**
 * Generate a new TOTP secret and QR code for a user
 */
export async function generateTwoFactorSetupData(userName: string): Promise<TwoFactorSetupData> {
  // Generate a secret
  const secret = authenticator.generateSecret();
  
  // Generate an authentication URL (for QR code)
  const otpauth = authenticator.keyuri(userName, SERVICE_NAME, secret);
  
  // Generate a QR code
  const qrCodeUrl = await QRCode.toDataURL(otpauth);
  
  // Generate a recovery code (simplified version - in production use a more secure approach)
  const recoveryCode = Array.from(
    { length: 10 },
    () => Math.floor(Math.random() * 36).toString(36)
  ).join('').toUpperCase();
  
  return {
    secret,
    qrCodeUrl,
    recoveryCode,
  };
}

/**
 * Verify a TOTP token against a secret
 */
export function verifyTwoFactorToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    console.error('Error verifying 2FA token:', error);
    return false;
  }
} 