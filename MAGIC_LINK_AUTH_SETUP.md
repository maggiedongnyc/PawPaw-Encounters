# Magic Link Authentication Setup Guide

This guide explains how to set up email/phone magic link authentication for the PawPaw Encounters app.

## Overview

The app uses Supabase magic link authentication to:
- Sign in users via email magic links
- Sign in users via phone SMS codes
- Provide secure, passwordless authentication
- Associate uploads, likes, and comments with specific users

## Setup Steps

### 1. Enable Email/Phone Authentication in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Providers**
3. Enable **Email** provider (for magic links)
4. Enable **Phone** provider (for SMS codes) - optional
5. Configure email templates if needed
6. Save changes

### 2. Configure Email Settings (Optional)

1. Go to **Authentication** > **Email Templates**
2. Customize the magic link email template
3. Set up SMTP settings if you want custom email sending

### 3. Configure Phone Settings (Optional)

1. Go to **Authentication** > **Providers** > **Phone**
2. Enable phone authentication
3. Configure SMS provider (Twilio, etc.)
4. Set up phone verification

### 4. Update Site URL

1. Go to **Authentication** > **URL Configuration**
2. Add your site URL: `http://localhost:3000` (for development)
3. Add redirect URLs: `http://localhost:3000/**` (for production, use your domain)

### 5. How It Works

#### Email Magic Link Flow

1. **User enters email**: User types their email in the sign-in form
2. **Magic link sent**: Supabase sends a magic link to the email
3. **User clicks link**: User clicks the link in their email
4. **Auto sign-in**: User is automatically signed in and redirected to the app
5. **Session persists**: Session is stored in browser localStorage

#### Phone SMS Flow

1. **User enters phone**: User types their phone number (with country code)
2. **SMS sent**: Supabase sends an SMS with a verification code
3. **User enters code**: User enters the code from SMS
4. **Verification**: Code is verified and user is signed in
5. **Session persists**: Session is stored in browser localStorage

### 6. Code Structure

- **`lib/supabase.ts`**: 
  - `signInWithEmail()` - Sends magic link to email
  - `signInWithPhone()` - Sends SMS code to phone
  - `verifyEmailOTP()` - Verifies email magic link
  - `verifyPhoneOTP()` - Verifies phone SMS code

- **`components/SignIn.tsx`**: Sign-in form with email/phone toggle
- **`contexts/AuthContext.tsx`**: Manages auth state and session
- **`components/AuthLoader.tsx`**: Shows sign-in form when not authenticated

### 7. Testing

1. **Email Magic Link**:
   - Enter your email in the sign-in form
   - Check your email for the magic link
   - Click the link to sign in
   - You should be redirected back to the app

2. **Phone SMS**:
   - Enter your phone number (with country code, e.g., +1234567890)
   - Check your phone for the SMS code
   - Enter the code to sign in

### 8. Troubleshooting

#### Issue: Magic link not working
- Check that email provider is enabled in Supabase
- Verify site URL is configured correctly
- Check email spam folder

#### Issue: SMS not sending
- Check that phone provider is enabled
- Verify SMS provider is configured (Twilio, etc.)
- Check phone number format (must include country code)

#### Issue: Redirect not working
- Check redirect URLs in Supabase settings
- Verify `detectSessionInUrl: true` in `lib/supabase.ts`
- Check browser console for errors

## Security Notes

- Magic links expire after a set time (default: 1 hour)
- SMS codes expire quickly (default: 60 seconds)
- Sessions persist across browser sessions
- Users can sign out to clear their session
- RLS policies ensure users can only modify their own data

