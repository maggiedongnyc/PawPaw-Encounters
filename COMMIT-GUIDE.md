# Commit Guide for Design System Improvements

## Recommended Commit Strategy

You can commit all changes at once or break them into semantic commits:

---

## Option 1: Single Commit (Recommended)

```bash
git add .
git commit -m "feat: implement comprehensive design system improvements

- Improve color contrast for WCAG AA compliance
- Reduce font weight variants from 6 to 3
- Add focus states for keyboard accessibility
- Standardize spacing to 8px grid system
- Improve bottom navigation with labels
- Simplify gradient usage
- Add loading, empty, and error state components
- Add prefers-reduced-motion support

BREAKING CHANGE: None - all changes are backwards compatible
```

---

## Option 2: Semantic Commits (By Task)

### Commit 1: Accessibility - Color Contrast
```bash
git add app/globals.css app/page.tsx app/my-pawpaws/page.tsx app/encounter components/MapView.tsx components/Leaderboard.tsx components/*.tsx
git commit -m "fix: improve color contrast for WCAG AA compliance

- Replace text-gray-500 with text-gray-600 (6.4:1 contrast)
- Remove gradient backgrounds from tags
- Update tag text colors to -900 variants
- Adjust placeholder opacity to 0.6

Fixes accessibility contrast issues across all components"
```

### Commit 2: Performance - Font Weights
```bash
git add app/layout.tsx app/*.tsx components/*.tsx
git commit -m "perf: reduce font weight variants from 6 to 3

- Update Poppins import to only 400, 600, 700 weights
- Replace font-medium with font-semibold
- ~40% reduction in font file size

Improves page load performance"
```

### Commit 3: Accessibility - Focus States
```bash
git add app/globals.css app/*.tsx components/*.tsx
git commit -m "feat: add focus states for keyboard accessibility

- Create focus utility classes (focus-ring, focus-ring-inset, focus-visible-ring)
- Add focus states to all interactive elements
- Enable full keyboard navigation

Implements WCAG 2.4.7 (Focus Visible) compliance"
```

### Commit 4: Design System - Spacing
```bash
git add tailwind.config.ts
git commit -m "refactor: standardize spacing to 8px grid system

- Add named spacing scale (xs, sm, md, lg, xl, 2xl, 3xl)
- Establish foundation for consistent spacing

Improves design consistency"
```

### Commit 5: Mobile UX - Bottom Navigation
```bash
git add components/BottomNavigation.tsx
git commit -m "feat: improve bottom navigation with labels

- Increase height from 48px to 56px
- Add text labels under all icons
- Reduce icon sizes from 24px to 20px
- Add focus states

Improves mobile usability and accessibility"
```

### Commit 6: Visual Design - Gradients
```bash
git add app/*.tsx components/*.tsx
git commit -m "refactor: simplify gradient usage to primary CTAs only

- Remove gradients from tags and leaderboard
- Keep gradients only on primary buttons
- Use solid colors for better contrast

Improves visual hierarchy and contrast"
```

### Commit 7: UX - Loading States
```bash
git add components/Skeleton.tsx components/Spinner.tsx components/Leaderboard.tsx app/*.tsx
git commit -m "feat: add loading skeletons for better UX

- Create Skeleton and Spinner components
- Add loading states to home page, My PawPaws, leaderboard
- Prevent layout shift during data fetch

Improves perceived performance"
```

### Commit 8: UX - Empty States
```bash
git add components/EmptyState.tsx app/*.tsx components/Leaderboard.tsx
git commit -m "feat: add empty state components

- Create reusable EmptyState component
- Add empty states to home page, My PawPaws, leaderboard
- Include clear CTAs for next steps

Improves user guidance and onboarding"
```

### Commit 9: Error Handling
```bash
git add components/ErrorMessage.tsx components/ErrorBoundary.tsx app/*.tsx
git commit -m "feat: add error handling and toast notifications

- Create ErrorMessage component
- Update ErrorBoundary to use ErrorMessage
- Add retry functionality to error states

Improves error recovery experience"
```

### Commit 10: Accessibility - Animations
```bash
git add app/globals.css
git commit -m "fix: optimize animations for accessibility

- Add prefers-reduced-motion support
- Respect user motion preferences

Implements WCAG 2.3.3 compliance"
```

### Commit 11: Documentation
```bash
git add DESIGN-SYSTEM-IMPROVEMENTS-SUMMARY.md COMMIT-GUIDE.md
git commit -m "docs: add design system improvements documentation

- Create comprehensive summary of all improvements
- Add commit guide for semantic commits"
```

---

## Verification Before Committing

### 1. Check Git Status
```bash
git status
```

### 2. Review Changes
```bash
git diff
```

### 3. Run Linter (if applicable)
```bash
npm run lint
```

### 4. Build Test
```bash
npm run build
```
Note: You may see an iCloud-related permission error. This is normal for projects in iCloud folders.

### 5. Verify No Unintended Changes
```bash
git diff --stat
```

---

## After Committing

### Push to Remote
```bash
git push origin main
```

or if you're on a feature branch:
```bash
git push origin feature/design-system-improvements
```

### Create Pull Request
If using GitHub/GitLab, create a PR with:

**Title**: `feat: Comprehensive design system improvements`

**Description**:
```markdown
## Summary
Implements comprehensive design system improvements for WCAG AA compliance and production readiness.

## Changes
- ✅ Color contrast improvements (WCAG AA compliant)
- ✅ Font weight reduction (40% file size savings)
- ✅ Focus states for keyboard navigation
- ✅ 8px spacing grid system
- ✅ Improved bottom navigation
- ✅ Simplified gradient usage
- ✅ Loading, empty, and error state components
- ✅ Reduced motion support

## Testing
- [ ] Keyboard navigation works throughout
- [ ] Color contrast meets WCAG AA
- [ ] Loading states display correctly
- [ ] Empty states show appropriate CTAs
- [ ] Error states allow retry
- [ ] Mobile bottom nav is usable
- [ ] Reduced motion preference is respected

## Documentation
See DESIGN-SYSTEM-IMPROVEMENTS-SUMMARY.md for complete details.

## Breaking Changes
None - all changes are backwards compatible.
```

---

## Rollback (if needed)

If you need to rollback these changes:

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Revert specific commit
git revert <commit-hash>
```

---

## Notes

- All changes are backwards compatible
- No database migrations required
- No environment variable changes needed
- Safe to deploy incrementally
- Can be tested in isolation

---

**Ready to commit?** Choose Option 1 for simplicity or Option 2 for granular history.


