# Problem:

all events in MemoryEditorPage is not only apply to this page but all pages.
cursor is a problem that apply to all the page.
another problem is cursor doesn't turn to grabbing when move. the cursor shoud change to hand.

Remove canvas scale/position from tool configuration - The tool system shouldn't need real-time scale/position updates
Remove or disable logging useEffects in production - These are expensive and run frequently
Memoize the elementBehaviors creation - Consider using useMemo for the behaviors object
Simplify view state effect dependencies - Remove current scale/position from the dependency array

Medium Priority:
Replace function dependencies with useCallback - Ensure getToolCursorStyle is properly memoized
Optimize element update patterns - The Object.assign pattern in hooks might be causing reference issues
Review upload manager state updates - The complex dependency chain could be simplified

Low Priority:
Consider splitting large useEffect hooks - Some effects handle multiple concerns
Review transformer update logic - The transformer effect runs on every selection change
