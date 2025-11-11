# Deployment Guide

## 1. Testing Production Build Locally

### Steps:

1. **Stop the dev server** (if running):
   ```bash
   # Find and kill the process on port 3001
   lsof -ti:3001 | xargs kill -9
   ```

2. **Build the production version**:
   ```bash
   npm run build
   ```

3. **Start the production server**:
   ```bash
   npm run start
   ```

4. **Test the production build**:
   - Visit: http://localhost:3001
   - Test all major features:
     - Home page
     - Upload encounter
     - View encounters
     - Map view
     - Authentication
     - Profile pages

5. **Compare with dev server**:
   - Production build is optimized and minified
   - Should be faster but harder to debug
   - Check browser console for any errors

---

## 2. Remove Debug Console.log Statements

### Current Status:
- 17 console.log statements found in production code
- console.error statements should be kept for production error tracking

### Files with console.log:
- `lib/supabase.ts` - 3 debug logs
- `components/NotificationBell.tsx` - 5 debug logs
- `components/Comments.tsx` - 4 debug logs
- `app/my-pawpaws/page.tsx` - 3 debug logs
- `app/upload/page.tsx` - 1 debug log
- Other files - various debug logs

### Recommendation:
- Remove all `console.log()` statements
- Keep `console.error()` for production error tracking
- Use environment check: `if (process.env.NODE_ENV === 'development') { console.log(...) }`

---

## 3. Add Error Tracking (Sentry)

### Benefits:
- Track errors in production
- Get notified of crashes
- See error stack traces
- Monitor performance

### Setup Steps:

1. **Install Sentry**:
   ```bash
   npm install @sentry/nextjs
   ```

2. **Initialize Sentry**:
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```

3. **Configure environment variables**:
   - Add to `.env.local`:
     ```
     NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
     ```

4. **Update next.config.ts**:
   - Sentry wizard will update this automatically

5. **Test error tracking**:
   - Add a test error to verify it works

---

## 4. Performance Optimization

### Quick Wins:

1. **Image Optimization**:
   - Use Next.js Image component
   - Add proper image sizes
   - Use WebP format

2. **Code Splitting**:
   - Already using dynamic imports for MapView
   - Consider lazy loading more components

3. **Font Optimization**:
   - Already using next/font/google
   - Consider reducing font weights

4. **Bundle Analysis**:
   ```bash
   npm install @next/bundle-analyzer
   ```
   - Add to `next.config.ts`
   - Run: `ANALYZE=true npm run build`

5. **Caching**:
   - Add proper cache headers
   - Use Next.js caching strategies

6. **Remove Unused Dependencies**:
   - Review package.json
   - Remove unused packages

---

## Next Steps:

1. ✅ Test production build locally
2. ⬜ Remove debug console.log statements
3. ⬜ Add Sentry error tracking
4. ⬜ Run bundle analyzer
5. ⬜ Optimize images
6. ⬜ Review and optimize dependencies

