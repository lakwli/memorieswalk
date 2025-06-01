- **Generic Behavior**: Through `IBaseElement` interface and `BaseElement` implementation. drag, rotate, resuze, delete, bring to front, bring to back...

- **Generic Data**: Common element properties in base classes (position, dimension,zIndex)

- **Element-specific Behavior**: Each element type implements its unique behaviors. Photo: upload, compress, screen progress status UI feedback upon uplod (compress, upload, ready, or failed). Upon persist file should move from temp storage to permanent storage.Please note that user only upload one file by one file, not multiple files.

- **Element-specific Data**: Separate stage and state data structures per element type. Photo: PhotoData and Photostate. PhotoData contain original siz and dimension. PhotoData is part of the data to be save into database. PhotoState keep the state if it is new or to-be-remove or existing and changing state should not refresh the screen (so it use useRef). PhotoState is defined upon user load the memory (existing) or upon user upload a new photo (new) or user remove a photo (to-be-remove). If user click on save, after the canvas is save including the photo, after all the data is save including canvas specifc data, textbox data, photo data, the post save will happen where photo state is changed (from new to existing).
  For element textbox, there could be font style, font size etc. there is no separate textbox state to handle.

- **State Management Separation**: Using both stage data (re-render) and refs (no re-render).

- **Persistent Management Separation**: Upon save, all data save to be within atomic. so there should be within single function to save all the data together including canvas own data, textbox data, photo data.

Handles generic element behaviors (drag, rotate, etc.)

- Allows for specific element behaviors (photo upload progress, text editing)

- Supports different state management needs

- Works with existing implementations

- Makes future additions easy
