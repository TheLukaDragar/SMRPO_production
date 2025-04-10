'use server';

import { connectToDatabase } from "@/lib/db/connection";
import { ObjectId } from "mongodb";
import { AppError, createErrorResponse, ErrorResponse } from '../utils/error-handling';
import { cookies } from 'next/headers';
import { generateTwoFactorSecret, verifyToken, generateRecoveryCode, markSessionAsVerified } from '@/lib/utils/two-factor-utils';
import { generateQRCode as generateQRCodeFromUrl } from '../utils/two-factor-utils';
import { revalidatePath } from 'next/cache';

// Setup 2FA for a user - generate secret and QR code
export async function setupTwoFactor(userId: string): Promise<{ otpauthUrl: string; secret: string; qrCodeUrl: string } | ErrorResponse> {
  try {
    const { db } = await connectToDatabase();
    
    // Fetch the user
    const user = await db().collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return createErrorResponse(new AppError('User not found', 404, 'NotFoundError'));
    }
    
    // Generate a new secret
    const { otpauth_url, base32 } = await generateTwoFactorSecret(user.userName);
    
    // Generate QR code
    const qrCodeUrl = await generateQRCode(otpauth_url || '');
    
    // Store the temporary secret for verification later
    // We don't save it to the user document yet - only after verification
    const cookieStore = await cookies();
    cookieStore.set('temp_2fa_secret', base32 || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 600, // 10 minutes
      path: '/'
    });
    
    return {
      otpauthUrl: otpauth_url || '',
      secret: base32 || '',
      qrCodeUrl
    };
  } catch (error) {
    return createErrorResponse(error);
  }
}

// Verify and activate 2FA setup
export async function verifyAndActivateTwoFactor(userId: string, token: string): Promise<{ success: boolean; recoveryCode: string } | ErrorResponse> {
  try {
    const { db } = await connectToDatabase();
    const cookieStore = await cookies();
    
    // Get the temporary secret from cookie
    const tempSecret = cookieStore.get('temp_2fa_secret')?.value;
    
    if (!tempSecret) {
      return createErrorResponse(new AppError('2FA setup expired or not started', 400, 'ValidationError'));
    }
    
    // Verify the token
    const isValid = verifyToken(token, tempSecret);
    
    if (!isValid) {
      return createErrorResponse(new AppError('Invalid verification code', 400, 'ValidationError'));
    }
    
    // Generate a recovery code
    const recoveryCode = generateRecoveryCode();
    
    // Activate 2FA for the user
    await db().collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          twoFactorEnabled: true,
          twoFactorSecret: tempSecret,
          twoFactorRecoveryCode: recoveryCode
        } 
      }
    );
    
    // Mark the current session as verified
    const sessionVerified = await markSessionAsVerified(userId);
    
    // Clear the temporary secret cookie
    cookieStore.delete('temp_2fa_secret');
    
    // Revalidate profile page
    revalidatePath('/profile');
    
    return { 
      success: true,
      recoveryCode
    };
  } catch (error) {
    return createErrorResponse(error);
  }
}

// Verify 2FA login
export async function verifyTwoFactorLogin(token: string, userId: string): Promise<{ success: boolean } | ErrorResponse> {
  try {
    const { db } = await connectToDatabase();
    
    // Fetch the user
    const user = await db().collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return createErrorResponse(new AppError('User not found', 404, 'NotFoundError'));
    }
    
    if (!user.twoFactorEnabled) {
      // For backward compatibility - if a user somehow gets to 2FA verification
      // but doesn't have 2FA enabled, mark their session as verified
      await markSessionAsVerified(userId);
      return { success: true };
    }
    
    let isValid = false;
    
    // Check if token is a recovery code
    if (token === user.twoFactorRecoveryCode) {
      isValid = true;
      
      // Generate a new recovery code after use
      const newRecoveryCode = generateRecoveryCode();
      
      // Update the user's recovery code
      await db().collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { twoFactorRecoveryCode: newRecoveryCode } }
      );
    } else {
      // Verify TOTP token
      if (!user.twoFactorSecret) {
        return createErrorResponse(new AppError('Two-factor secret not found', 500, 'ServerError'));
      }
      isValid = verifyToken(token, user.twoFactorSecret);
    }
    
    if (!isValid) {
      return createErrorResponse(new AppError('Invalid verification code', 400, 'ValidationError'));
    }
    
    // Mark the session as 2FA verified
    await markSessionAsVerified(userId);
    
    // Revalidate profile page
    revalidatePath('/profile');
    
    return { success: true };
  } catch (error) {
    return createErrorResponse(error);
  }
}

// Disable 2FA for a user
export async function disableTwoFactor(userId: string, currentPassword: string): Promise<{ success: boolean } | ErrorResponse> {
  try {
    const { db } = await connectToDatabase();
    
    // Fetch the user
    const user = await db().collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return createErrorResponse(new AppError('User not found', 404, 'NotFoundError'));
    }
    
    // Verify the password before disabling 2FA
    const { compare } = await import('bcrypt-ts');
    const isPasswordValid = await compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return createErrorResponse(new AppError('Invalid password', 401, 'AuthError'));
    }
    
    // Disable 2FA for the user
    await db().collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          twoFactorEnabled: false 
        },
        $unset: { 
          twoFactorSecret: "",
          twoFactorRecoveryCode: "" 
        }
      }
    );
    
    // Revalidate profile page
    revalidatePath('/profile');
    
    return { success: true };
  } catch (error) {
    return createErrorResponse(error);
  }
}

// Generate a QR code for the 2FA setup
async function generateQRCode(otpauthUrl: string): Promise<string> {
  try {
    return await generateQRCodeFromUrl(otpauthUrl);
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
} 