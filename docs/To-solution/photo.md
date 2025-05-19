It is expected that In a drawing app without auto-save, the expected behavior would be that the newly added photo does not remain on the canvas after navigating away. Since user didn’t explicitly save the changes, the app would typically revert to the last saved state when reopening the canvas. It is however, the current behavior is, this photo is saved and exist in photo record and also the link record (please refer to schema.sql for database structure). Please propose how to handle this.

Backend File Handling

- Temporary Storage:
- Place new image uploads in a temporary folder.
- Use a metadata system to track unsaved changes.
- Persistent Save:
- When the user clicks "Save," move the image from the temporary folder to permanent storage.
- Update a database record for retrieval later.

Frontend Handling

- Session Management:
- When the user opens a canvas, check if there’s an unsaved version available.
- If session storage exists, offer the option to restore the last state.
- Clear Unsaved Data:
- If the user closes the canvas or navigates away without saving, remove the temporary session.
- Can use IndexedDB or localStorage for temporary state tracking.

![alt text](image.png)
