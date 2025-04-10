'use server';

import { cookies } from 'next/headers';
import { connectToDatabase } from '../db/connection';
import { ObjectId } from 'mongodb';

// Create a manual implementation to avoid speakeasy issues with Next.js
export async function generateTwoFactorSecret(userName: string) {
  try {
    // Dynamically import speakeasy to avoid issues with "use server"
    const speakeasy = await import('speakeasy');
    
    // Generate secret safely by accessing the library method directly
    const secretObject = speakeasy.generateSecret({
      length: 20
    });
    
    // Generate the otpauth URL manually
    const issuer = 'SMRPO App';
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedUserName = encodeURIComponent(userName);
    const otpauth_url = `otpauth://totp/${encodedIssuer}:${encodedUserName}?secret=${secretObject.base32}&issuer=${encodedIssuer}`;

    return {
      otpauth_url,
      base32: secretObject.base32
    };
  } catch (error) {
    console.error('Error generating 2FA secret:', error);
    throw error;
  }
}

// Generate QR code data URL from the OTP auth URL
export async function generateQRCode(otpauthUrl: string) {
  try {
    // Dynamically import to avoid issues with "use server"
    const QRCode = await import('qrcode');
    const dataUrl = await QRCode.toDataURL(otpauthUrl);
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

// Verify a TOTP token against a secret
export async function verifyToken(token: string, secret: string) {
  try {
    // Dynamically import speakeasy to avoid issues with "use server"
    const speakeasy = await import('speakeasy');
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1 // Allow 1 time step before and after (30 seconds before and after)
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return false;
  }
}

// Generate a recovery code
export async function generateRecoveryCode() {
  // Generate a 10-character alphanumeric code
  return Math.random().toString(36).substring(2, 12).toUpperCase();
}

// Mark session as 2FA verified
export async function markSessionAsVerified(userId: string) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    
    if (!sessionToken) {
      throw new Error('No session token found');
    }
    
    const { db } = await connectToDatabase();
    await db().collection('sessions').updateOne(
      { 
        token: sessionToken,
        userId: new ObjectId(userId)
      },
      { 
        $set: { 
          twoFactorVerified: true 
        } 
      }
    );
    
    return true;
  } catch (error) {
    console.error('Error marking session as verified:', error);
    return false;
  }
}

// Check if user has 2FA enabled
export async function getUserTwoFactorStatus(userId: string) {
  try {
    const { db } = await connectToDatabase();
    const user = await db().collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { twoFactorEnabled: 1, twoFactorSecret: 1 } }
    );
    
    return {
      enabled: user?.twoFactorEnabled || false,
      hasSecret: !!user?.twoFactorSecret
    };
  } catch (error) {
    console.error('Error getting user 2FA status:', error);
    return { enabled: false, hasSecret: false };
  }
}