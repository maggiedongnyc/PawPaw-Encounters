# Debugging Anonymous Authentication

If authentication is not working, check the following:

## 1. Check Browser Console

Open your browser's developer console (F12) and look for:
- "No session found, signing in anonymously..."
- "Successfully signed in anonymously: [user-id]"
- Any error messages

## 2. Verify Anonymous Auth is Enabled in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Scroll down to **Anonymous** provider
5. Make sure it's **Enabled**
6. Click **Save**

## 3. Check Environment Variables

Make sure your `.env.local` file has:
```env
NEXT_PUBLIC_SUPABASE_URL=https://cxuzveadyskxgyzghfxa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 4. Common Errors

### Error: "Anonymous sign-in is disabled"
**Solution**: Enable Anonymous authentication in Supabase Dashboard (see step 2)

### Error: "Invalid API key"
**Solution**: Check that your `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct

### Error: "Network error"
**Solution**: Check your internet connection and Supabase project status

### Loading screen stuck
**Solution**: 
1. Check browser console for errors
2. Clear browser localStorage: `localStorage.clear()` in console
3. Refresh the page

## 5. Test Authentication Directly

Open browser console and run:
```javascript
// Check current session
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)

// Try to sign in anonymously
const { data, error } = await supabase.auth.signInAnonymously()
console.log('Sign in result:', { data, error })
```

## 6. Check RLS Policies

Make sure you've run the `anonymous-auth-schema.sql` script in Supabase SQL Editor.

## 7. Restart Dev Server

After making changes:
1. Stop the dev server (Ctrl+C)
2. Clear `.next` folder: `rm -rf .next`
3. Restart: `npm run dev`

