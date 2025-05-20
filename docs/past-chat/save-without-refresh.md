20/05:

I want the save of canvas without triggering the whole canvas refresh as this will impact the performance. please review below if you know what to do.

### 1. **Separate State Management**

- Introduce a new `photoStates` object with userRef to manage the backend-specific `state` (`N`, `P`, `R`) for each photo. example: photoStates.current = {
  "photo1": "N", // New photo
  "photo2": "P", // Persisted photo
  "photo3": "R" // Removed photo
  };
- Use the photo `id` as the key in `photoStates` and the `state` as the value.

### 2. **Refactor `photos` State**

- Remove the `state` property from the `photos` array.(remove isNew, as this related to the state when it is N)
- Ensure the `photos` array contains only properties relevant to rendering the canvas (e.g., `x`, `y`, `width`, `height`, `image`).

### 3. **Update Save Logic**

- Frontend: Combine the `photos` array and `photoStates` object, along with others (e.g textData, canvas related data configuration_data e.g. position) when constructing the payload for the server.

- Backend (/workspace/server/routes/memory.js):

1. 3. The server receives the `state` along with the other photo data.
2. For each photo in the `photos` array, its `id` is used to look up its `state` in the `photoStates` object.

- Frontend: After a successful save:

  - Update `photoStates` to reflect the new states (`N` → `P`, `P` → `P`).
  - Remove entries with `state: "R"` from `photoStates`.

### 4. **Prevent Canvas Refresh**

- Ensure that changes to `photoStates` do not trigger updates to the `photos` array or the canvas.
- Decouple backend-specific state changes from frontend rendering logic.
