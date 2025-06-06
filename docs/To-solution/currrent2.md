# Toolbar Persistence Strategy

Yes, the toolbar should remain persistent during both selection and editing modes, but with different control sets:

## Expected Behavior

### Single Click (Selection Mode)

Show: Font style, font size, alignment + common controls (send to back, delete, etc.)
Allow: Resize, rotate, move operations
Toolbar stays visible until user deselects

### Double Click (Edit Mode)

Show: Enhanced text editing controls (font style, font size, alignment, bold, italic, underline, text color, etc.)
Hide: Common selection controls (send to back, delete, resize handles)
Disable: Resize, rotate, move operations
Toolbar stays visible during entire editing session

### Conditions

toolbar should disappear when:

User clicks on empty canvas
User selects a different element
User presses ESC key
User clicks outside the canvas area
