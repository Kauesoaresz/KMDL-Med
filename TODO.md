# TODO - Fix Sidebar Overlap Issue in Simulados Lista

## Task - COMPLETED ✅
Fix the sidebar overlap issue on the "simulados lista" page where the sidebar overlaps the screen content.

## Changes Made
1. **Information Gathered**: 
   - The issue was in `src/views/app/simulados/lista.ejs`
   - Uses `<main class="with-sidebar">` but container didn't have proper left spacing
   - Sidebar has `position: fixed` with `width: 260px`
   - The `.with-sidebar` class in `global-responsive.css` has margin-left but wasn't properly offsetting content

2. **Fix Applied to `src/public/css/app/simulados-lista.css`**:
   - Added `--sidebar-width: 260px` variable to `:root` block
   - Added `padding: 0 24px` to `.container` for left/right spacing
   - Added media query for desktop (min-width: 901px):
     - Sets `margin-left: 0 !important` to override conflicting global styles
     - Sets `padding-left: calc(var(--sidebar-width) + 24px)` to properly offset content from sidebar

3. **Result**:
   - Content is now properly offset from the fixed sidebar on desktop
   - Mobile/tablet view remains unchanged (sidebar is hidden by default)
   - No horizontal scrolling should occur

