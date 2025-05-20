it is still the same. After save, the picture become very big. Below is the detail step.
#1: create memory -> dashboard -> add photo (photo shown in normal size)-> save : picture become very big and moved to center [call this view as VIEW-A].
#2: Back to dashboard -> memory -> picture remain as big and center [as VIEW-A].
#3: I then resize the picture and move to right -> save: The picture with the size that i resized (which is correct) but moved to left corner.  
#4: Move the picture to center -> save: picture again move to left.
#5: Back to dashboard->select memory->it become big size and center [as VIEW-A].
It seems that the grid view with the position and also the picture size is not saved.

Fix now:

1. DO not refresh the canvas upon save. make the save asynchrnonous to server.

Here are the **implementation steps** to ensure the solution is simple, fits the requirements, and does not break existing logic:

---

### **Step 1: Introduce `photoStates` with `useRef`**

- Add a `photoStates` object managed with `useRef` to track backend-specific states (`N`, `P`, `R`).
- Initialize `photoStates` when photos are loaded from the server or added by the user.

#### Code Example:

```javascript
const photoStates = useRef({});
```

---

### **Step 2: Refactor `photos` State**

- Remove the `state` property from the `photos` array.
- Ensure the `photos` array contains only rendering-related properties (e.g., `x`, `y`, `width`, `height`, `image`).

---

### **Step 3: Update Save Logic**

1. **Frontend**:

   - When saving, send both the `photos` array and the `photoStates` object to the server.
   - Do not modify the `photos` array during this process.

2. **Backend**:

   - Ensure the server processes the `photoStates` object to determine the state (`N`, `P`, `R`) for each photo.

3. **Post-Save Updates**:

   - After a successful save:

     - Update `photoStates` to reflect the new states (`N` → `P`, `P` → `P`).
     - Remove entries with `state: "R"` from `photoStates`.

#### Code Example:

```javascript
const saveMemoryLayout = async () => {
  const payload = {
    photos,
    photoStates: photoStates.current,
  };
  await memoryService.updateMemory(memory.id, payload);

  // Update photoStates after save
  Object.keys(photoStates.current).forEach((id) => {
    if (photoStates.current[id] === "N") {
      photoStates.current[id] = "P";
    } else if (photoStates.current[id] === "R") {
      delete photoStates.current[id];
    }
  });
};
```

---

### **Step 4: Prevent Canvas Refresh**

- Ensure that changes to `photoStates` do not trigger updates to the `photos` array or the canvas.
- Use `useRef` for `photoStates` to avoid triggering re-renders.
