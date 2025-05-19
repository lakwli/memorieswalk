# Photo Management Design

## Problem Statement

When users upload photos to a canvas, we need to:

1. Prevent unsaved photos from persisting after navigation
2. Ensure photos are only saved when the canvas is explicitly saved
3. Clean up unused photos efficiently
4. Maintain data integrity throughout all operations

## Core Concepts

### Photo States

1. New (N)

   - Newly uploaded photos
   - Stored in temporary location
   - Not yet associated with any canvas
   - Removed if not saved within 24 hours

2. Permanent (P)

   - Photos saved with a canvas
   - Stored in permanent location
   - Linked to one or more canvases
   - Persists until explicitly removed

3. Removed (R)
   - Photos unlinked from canvas
   - Marked for deletion
   - Deleted when no more canvas links exist
   - Cannot be accessed once marked

### Storage Organization

- Temporary Storage: For new uploads awaiting save
- Permanent Storage: For photos saved with canvases
- Single UUID used throughout photo lifecycle
- Clear separation of temporary and permanent files

### Canvas Save Operation

The canvas save operation becomes the key point where photo states transition:

1. New photos are moved to permanent storage
2. Removed photos are marked for cleanup
3. Existing photos maintain their state
4. All changes happen in a single transaction

### Data Management

1. Database Records

   - Track photo state and ownership
   - Maintain canvas-photo relationships
   - Record metadata and file locations

2. File System
   - Clear separation of temp and permanent files
   - Organized by UUID for easy lookup
   - Automated cleanup of temporary files

### Cleanup Processes

1. Temporary Photo Cleanup

   - Removes unsaved photos after 24 hours
   - Cleans both database records and files
   - Runs as a scheduled background task

2. Removed Photo Cleanup
   - Checks for photos with no canvas links
   - Deletes orphaned photos
   - Maintains storage efficiency

## Changes from Current to Target Implementation

### Current Implementation

1. Photo Upload and Storage

   - Direct upload to permanent storage
   - Immediate linking to memories
   - No temporary state handling

2. API Endpoints
   - GET `/api/memories/photos/{photoId}/view-authenticated`: Serves photos
   - POST `/api/memories/{memoryId}/photos`: Links photos to memory
   - POST `/api/memories/photos`: Uploads photos
   - PUT `/api/memories/:memoryId`: Updates memory and canvas

### Storage Structure Changes

Current:

```
/workspace/server/
├── uploads/              # Current upload directory
│   └── user_1/          # User-specific folders
└── file_storage/        # Current permanent storage
    └── photos/         # All photos stored here
```

Target:

```
/workspace/server/file_storage/
├── temp_photos/         # Temporary storage (N state)
│   └── {uuid}.jpg      # Photos not yet saved to any canvas
└── photos/             # Permanent storage (P state)
    └── {uuid}.jpg      # Photos saved with canvas
```

Key Changes:

- Repurpose storage structure for state management
- Use UUID-based organization instead of user folders
- Clear separation between temp and permanent storage

### Target Implementation

1. Photo Upload and Storage

   - Upload to temporary storage first
   - State-based storage management
   - Links created only on canvas save

2. API Changes

   - Remove: `/api/memories/photos/{photoId}/view-authenticated`
   - Remove: `/api/memories/{memoryId}/photos`
   - Rename: `/api/memories/photos` to `/api/photos/upload`
   - Enhance: PUT `/api/memories/:memoryId`
   - Add: GET `/api/photos/retrieve/{id}?state=N|P`

3. Save Operation Enhancement

   - Current:
     - Updates memory details
     - Updates canvas configuration
     - Manages timestamps
   - Adding:
     - Photo state transitions (N->P, P->R)
     - File movements between storage locations
     - Link creation and removal
     - All in single transaction

4. Key Improvements
   - Better state management
   - Proper cleanup of unused photos
   - Clear separation of concerns
   - Strong data integrity

## Security Considerations

### Access Control

1. Temporary Photos

   - Only accessible by uploading user
   - Limited time window for access
   - Removed if not saved

2. Permanent Photos
   - Access based on canvas permissions
   - Shareable through canvas sharing
   - Protected from unauthorized access

### Data Integrity

1. Transaction Safety

   - All state changes in single transaction
   - File operations after successful commits
   - Clear rollback paths for failures

2. Error Handling
   - Clean recovery from failures
   - No orphaned files or records
   - Consistent state maintenance

## Benefits

1. Clear Photo Lifecycle

   - Photos follow defined state transitions
   - No unintended persistence
   - Efficient cleanup of unused files

2. Data Consistency

   - Strong transaction boundaries
   - No orphaned records or files
   - Clear ownership and access rules

3. User Experience
   - Immediate photo upload feedback
   - Clear save/discard behavior
   - Reliable photo management

## Limitations

1. Storage Requirements

   - Temporary storage for unsaved photos
   - Additional state tracking overhead
   - Background job processing needs

2. Complexity
   - State transition management
   - Transaction coordination
   - Cleanup process monitoring
