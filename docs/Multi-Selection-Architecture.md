# Multi-Selection Architecture

## Overview

The enhanced `useElementActivity` hook now supports both single and multi-selection modes, enabling grouping operations while maintaining clean state management.

## Selection Modes

### 1. Stage Active (`NONE`)

```javascript
// State
selectionMode: "none";
selectedElements: [];
activityMode: null;

// Use case: Canvas background, no elements selected
```

### 2. Single Element Active (`SINGLE`)

```javascript
// State
selectionMode: "single";
selectedElements: [element];
activityMode: "selected" | "editing";

// Use cases:
// - Normal element selection
// - Text editing mode
// - Transform/resize operations
```

### 3. Multi-Selection Active (`MULTI`)

```javascript
// State
selectionMode: 'multi'
selectedElements: [element1, element2, ...]
activityMode: 'selected' // Always selected in multi-mode

// Use cases:
// - Selecting multiple elements for grouping
// - Bulk operations (delete, move, align)
// - Group creation workflow
```

## Grouping Workflow

### Step 1: Start Multi-Selection

```javascript
// User Ctrl+clicks first element
startMultiSelection(firstElement);
// Result: SINGLE mode with one element
```

### Step 2: Add More Elements

```javascript
// User Ctrl+clicks second element
addToSelection(secondElement);
// Result: Automatically switches to MULTI mode
```

### Step 3: Create Group

```javascript
if (canGroup) {
  // true when selectedElements.length > 1
  const groupElement = createGroupFromElements(selectedElements);
  activateElement(groupElement); // Switch back to SINGLE mode with new group
}
```

## Event Handling Patterns

### Click Handler

```javascript
const handleElementClick = (element, event) => {
  if (event.ctrlKey || event.metaKey) {
    // Multi-selection mode
    if (isMultiSelection) {
      toggleSelection(element);
    } else {
      startMultiSelection(element);
    }
  } else {
    // Normal single selection
    activateElement(element);
  }
};
```

### Double-Click for Editing

```javascript
const handleElementDoubleClick = (element) => {
  if (selectionMode === SELECTION_MODES.SINGLE) {
    startEditing(); // Only works in single mode
  }
};
```

## Benefits

### 1. **Clear State Hierarchy**

- Stage → Single Element → Multiple Elements → Group Element
- No ambiguous states or conflicting selections

### 2. **Proper Multi-Selection Support**

- Handles Ctrl+click interactions
- Supports grouping operations
- Maintains selection boundaries

### 3. **Backwards Compatibility**

- Existing code using `activeElement` continues to work
- Gradual migration path for legacy components

### 4. **Event Handling Resolution**

- Separates single-click (selection) from double-click (editing)
- Prevents toolbar controls from causing deselection conflicts
- Supports both individual and bulk operations

## Implementation Notes

### Multi-Selection UI Indicators

```javascript
// Show selection outline for all selected elements
selectedElements.forEach((element) => {
  if (isMultiSelection) {
    showMultiSelectionOutline(element);
  } else if (activeElement === element) {
    showSingleSelectionOutline(element);
  }
});
```

### Toolbar State Management

```javascript
// Different toolbars for different selection modes
if (isMultiSelection && canGroup) {
  return <GroupingToolbar selectedElements={selectedElements} />;
} else if (activeElement) {
  return <ElementToolbar element={activeElement} isEditing={isEditing} />;
} else {
  return <StageToolbar />;
}
```

This architecture provides a solid foundation for both current functionality and future grouping features.
