Okay, this is a solid architectural foundation and a clear set of requirements with helpful mockups. Here’s how I would approach implementing this web application, blending the architectural design with the specific feature requests and screen designs:

## Web Application Implementation Plan

This plan breaks down the development into logical phases, focusing on delivering core functionality incrementally.

**Core Technologies (as per architecture.md):**

- **Frontend:** React, Vite, Fabric.js (or similar), React Router, Zustand (if needed), Tailwind CSS (or similar).
- **Backend:** Node.js, Express.js, PostgreSQL, JWT, `sharp`.
- **Development:** Monorepo structure.

---

### Phase 1: Project Setup, Backend Foundation & Core Authentication

**Goal:** Establish the project structure, basic backend, user authentication, and database schema.

1.  **Project Initialization (Monorepo):**

    - Set up the monorepo as described in `architecture.md` (`/workspaces/photosharing/`).
    - Initialize the frontend React app (`src/`) using Vite.
    - Initialize the backend Node.js/Express app (`server/`).
    - Configure root `package.json` and `server/package.json`.
    - Set up basic linting/formatting (ESLint, Prettier).

2.  **Database Setup (PostgreSQL):**

    - Define initial schema for:
      - `users` (id, username, password_hash, created_at, updated_at) - `username` should be unique.
      - `canvases` (id, user_id (FK to users), title, canvas_data (JSONB), created_at, updated_at, thumbnail_url).
      - `share_links` (id, canvas_id (FK to canvases), token (unique, unguessable), expires_at (nullable), allow_downloads (boolean), created_at).
    - Set up migrations (e.g., using `node-pg-migrate` or Knex.js migrations).

3.  **Backend - User Management & Authentication API:**

    - **(Admin-Only) User Creation Endpoint:** `POST /api/admin/users` (requires a mechanism for initial admin setup or a separate admin authentication). For simplicity, initial admin might be seeded, or a simple master key used for this endpoint initially.
    - **Login Endpoint:** `POST /api/auth/login` (validates credentials, returns JWT).
    - **Logout Endpoint:** `POST /api/auth/logout` (can be stateless if JWTs have short expiry, or involve a token blocklist if needed).
    - **JWT Middleware:** Protects routes, extracts user ID from token, and attaches it to `req.user`.
    - Password hashing (e.g., `bcrypt`).

4.  **Frontend - Basic Auth UI:**
    - Simple Login page component.
    - React Context for storing auth state (token, user info).
    - `services/authService.js` for API calls.
    - Protected route HOC/component using React Router to redirect unauthenticated users.

---

### Phase 2: "My Canvases" Dashboard & Basic Canvas CRUD

**Goal:** Implement the dashboard screen and the backend logic for managing canvases.

1.  **Backend - Canvas CRUD API:**

    - `POST /api/canvases`: Create a new canvas (requires authenticated user). Sets `user_id` from `req.user`. Returns new canvas object (or ID).
      - _Input:_ `{ title: "My New Canvas" }`
      - _Response:_ `{ id: ..., title: "My New Canvas", user_id: ..., canvas_data: null, ... }`
    - `GET /api/canvases`: List canvases for the authenticated user.
      - _Response:_ `[{ id, title, thumbnail_url, updated_at }, ...]`
    - `GET /api/canvases/:id`: Get a specific canvas (owned by the user). Returns full canvas data including `canvas_data` (JSONB).
    - `PUT /api/canvases/:id`: Update canvas (e.g., title, `canvas_data`).
    - `DELETE /api/canvases/:id`: Delete a canvas (owned by the user).
    - Middleware to ensure users can only access/modify their own canvases.

2.  **Frontend - "My Canvases" Dashboard (as per mockup /workspace/docs/screenshots/dashboard.png):**
    - **Page Component:** `pages/DashboardPage.js`.
    - **UI:**
      - Header: "My Canvas", User Profile icon/initials (top right).
      - Search bar (client-side filtering for now).
      - "Create Canvas" button:
        - Action: Calls `POST /api/canvases`. On success, navigates to Canvas Editor for the new canvas ID.
        - _Mockup Detail:_ Blue button with "Create Canvas".
      - "Delete Canvas" button:
        - Action: Only active if a canvas is selected (or implement per-canvas delete icons). Calls `DELETE /api/canvases/:id`. Requires confirmation.
        - _Mockup Detail:_ White button with "Delete Canvas".
      - "Recent Canvas" grid:
        - Fetches data from `GET /api/canvases`.
        - Displays each canvas as a card (initially, placeholder for thumbnail, then `thumbnail_url`). Cards should show canvas title (e.g., "Travel 2024").
        - Clicking a canvas navigates to the Canvas Editor for that canvas.
        - "View All" link (if pagination is implemented later).
    - **State:** Local component state for canvas list, search term.
    - **API Service:** `services/canvasService.js`.

---

### Phase 3: Canvas Editor - Core Functionality & Photo Uploads

**Goal:** Implement the Canvas Editor screen with core object manipulation and photo uploading.

1.  **Backend - Photo Upload & Serving:**

    - `POST /api/canvases/:id/photos` or `/api/photos?canvasId=:id`: Upload photo.
      - Uses `multer` for file handling.
      - Saves original image to `server/uploads/user_<userId>/canvas_<canvasId>/<filename>`.
      - Uses `sharp` to generate a display-optimized version and a small thumbnail.
      - Returns path/URL to the uploaded photo.
    - Static file serving (Express middleware) for the `uploads` directory.

2.  **Backend - Auto-Save & Manual Save Endpoint:**

    - Re-use `PUT /api/canvases/:id`. The request body will contain the `canvas_data` (JSON from Fabric.js) and potentially a new `thumbnail_data_url` (if using frontend thumbnail generation initially).
    - **Thumbnail Generation (Option 2 - Robust, from `architecture.md`):**
      - If frontend sends canvas JSON, backend could _eventually_ use a headless browser or specialized library to render the canvas JSON to an image for the `thumbnail_url`.
      - _Initial Simpler Approach for Thumbnails:_ Frontend sends a Data URL of the canvas view (`canvas.toDataURL()`) as part of the save payload. Backend saves this as the thumbnail. Update `canvases` table with `thumbnail_url`.

3.  **Frontend - Canvas Editor Page (as per mockup /workspace/docs/screenshots/canvas.png):**
    - **Page Component:** `pages/CanvasEditorPage.js`.
    - **Routing:** Takes `:canvasId` from URL parameter. Fetches canvas data using `GET /api/canvases/:canvasId`.
    - **Canvas Library Integration (Fabric.js):**
      - Initialize Fabric.js on a `<canvas>` element.
      - Load existing `canvas_data` into Fabric.js (e.g., `canvas.loadFromJSON(data)`).
    - **Workspace:**
      - Infinite/Scrollable: Configure Fabric.js for a large workspace, possibly with panning/zooming controls.
      - Background: White or configurable.
    - **Toolbar (Bottom, as per mockup):**
      - Each tool will be a button with an icon and label. The active tool should be highlighted.
      - **"Add Photo" (📁 Upload):**
        - Uses `React Dropzone` or `<input type="file">`.
        - On file selection/drop, uploads to backend (`POST /api/canvases/:id/photos`).
        - On successful upload, adds the image to the Fabric.js canvas (`fabric.Image.fromURL`).
        - Allow drag & drop directly onto the canvas area as well.
      - **"Add Text" (✍️ Text):**
        - Adds a `fabric.IText` object to the canvas.
        - Allow editing text content, basic styling (font, size, color - use Fabric.js properties and potentially a small context menu/panel when text is selected).
      - **"Draw" (🖌️ Draw):**
        - Enables Fabric.js free drawing mode (`canvas.isDrawingMode = true`).
        - Provide basic controls for color and brush width.
      - **"Rotate" (🔄 Rotate):**
        - This is usually an affordance on the selected object in Fabric.js (corner controls). Ensure these are enabled. The button might cycle through selection modes or offer a specific rotation input. Simpler: rely on Fabric.js's default controls for selected objects.
      - **"Layers" (📑 Layers):**
        - Select an object.
        - Buttons for "Bring Forward" (`canvas.bringForward()`), "Send Backward" (`canvas.sendBackwards()`), "Bring to Front", "Send to Back".
    - **Top Bar (as per mockup):**
      - Back arrow (navigate to Dashboard).
      - Canvas Title (editable, updates `title` field).
      - **"Save" button (💾 Manual Save):**
        - Serializes canvas state (`canvas.toJSON()`).
        - Calls `PUT /api/canvases/:id` with `{ canvas_data: serializedData, title: currentTitle }`.
        - _Optional:_ Send a `canvas.toDataURL()` for thumbnail update.
      - **"Share" button (🔗 Share):** Opens the Share/Publish modal (Phase 4).
    - **Auto-Save Logic:**
      - `useEffect` hook with a debounce/throttle mechanism.
      - When canvas changes (Fabric.js `object:modified`, `object:added`, etc. events), trigger a save after a few seconds.
      - Calls `PUT /api/canvases/:id` similar to manual save.
    - **State Management for Canvas:**
      - Fabric.js manages its own internal object state.
      - React state for current tool, selected object properties (if building custom property editors), loading/saving status. Zustand or Redux Toolkit could be considered if side panel UIs for object properties become very complex, but try with local/Context first.

---

### Phase 4: Sharing & Public Viewing

**Goal:** Implement the functionality to generate shareable links and view shared canvases.

1.  **Backend - Share Link API:**

    - `POST /api/canvases/:id/share`: Create/get a share link for a canvas.
      - Generates a unique, unguessable token.
      - Saves to `share_links` table (token, canvas_id, expiry_date, allow_downloads).
      - Returns the share link URL (e.g., `https://yourdomain.com/share/:token`).
    - `GET /api/share/:token`: Retrieve canvas data for public viewing.
      - Looks up canvas by token. Checks expiry.
      - Returns read-only canvas data (`{ title, canvas_data, allow_downloads }`). _Does not return user-specific info._
    - _(Optional)_ `PUT /api/canvases/:id/share`: Update share link settings (e.g., expiry, allow_downloads).
    - _(Optional)_ `DELETE /api/canvases/:id/share`: Revoke share link.

2.  **Frontend - Share/Publish Modal (from Canvas Editor "Share" button):**

    - **UI:**
      - Modal dialog.
      - Button "Generate Share Link".
      - Displays the generated link (e.g., `https://yourdomain.com/share/:token`) with a "Copy" button.
      - Checkboxes/Inputs for "Set expiration date" (requires a date picker).
      - Checkbox for "Allow downloads" (if implementing this feature).
      - Information about current sharing status.
    - **Logic:** Calls backend share link APIs.

3.  **Frontend - Public View Page:**
    - **Page Component:** `pages/SharedCanvasPage.js`.
    - **Routing:** `/share/:token`. Extracts token from URL.
    - **Logic:**
      - Calls `GET /api/share/:token` to fetch canvas data.
      - Renders the canvas in a read-only mode. This might involve:
        - Initializing Fabric.js.
        - Loading `canvas_data`.
        - Disabling all editing interactions (`canvas.selection = false`, objects not selectable/movable).
      - Displays canvas title.
      - If `allow_downloads` is true, provide a button to download the canvas (e.g., as a PNG using `canvas.toDataURL()` or a backend endpoint that renders and serves it).

---

### Phase 5: Admin Functionality & Refinements

**Goal:** Implement admin user management and polish the application.

1.  **Frontend - Admin User Management UI:**

    - A dedicated route/page (e.g., `/admin/users`), protected for admin users. (How to distinguish admin? A `role` field in `users` table).
    - Lists existing users.
    - Form to create new users (username, password) - calls `POST /api/admin/users`.
    - _(Optional)_ Ability to delete or disable users.

2.  **Refinements & Polish:**
    - **Error Handling:** Consistent error messages, user-friendly feedback.
    - **Loading States:** Show spinners/loaders during API calls.
    - **Responsive Design:** Ensure the UI is usable on various screen sizes, especially the shared view and dashboard. The editor might be more desktop-focused.
    - **Accessibility (A11y):** Basic ARIA attributes, keyboard navigation.
    - **UX:** Confirm destructive actions (delete canvas). Clear visual feedback for active tools, save status.
    - **Empty States:** Friendly messages when no canvases exist, etc.
    - **Thumbnail Quality:** If initial frontend Data URL thumbnails are poor, implement robust backend thumbnail generation from canvas JSON.

---

### Phase 6: Deployment & Testing

**Goal:** Prepare the application for deployment and conduct testing.

1.  **Backend Deployment:**

    - Create `Dockerfile` for the `server/` application.
    - Configure environment variables (`.env`): `DATABASE_URL`, `JWT_SECRET`, `API_PORT`, `FRONTEND_URL` (for CORS).
    - Set up CORS middleware (`cors` npm package) in Express to allow requests from the frontend domain.
    - Deploy to chosen platform (VPS, Heroku, etc.).

2.  **Frontend Deployment:**

    - Configure environment variable for backend API URL (e.g., `VITE_API_BASE_URL`).
    - Build static assets: `npm run build` in `src/`.
    - Deploy static assets to Netlify, Vercel, GitHub Pages, or serve via Nginx if self-hosting everything.

3.  **Local Development with Docker Compose:**

    - Create `docker-compose.yml` to spin up backend, PostgreSQL database.

4.  **Testing:**
    - **Manual Testing:** Thoroughly test all user flows on different browsers/devices.
    - **(Optional) Unit/Integration Tests:** Add tests for critical backend logic (auth, canvas permissions) and frontend components/services.

---

### Key Decisions & Considerations during Implementation:

- **Canvas Library Choice:** Stick with Fabric.js as suggested. It's mature and feature-rich.
- **Thumbnail Generation:** Start with frontend-generated Data URLs sent to backend for simplicity for "Recent Canvas" thumbnails. Plan to upgrade to backend rendering from JSON (`sharp` + SVG export from Fabric.js, or headless browser) if quality/performance becomes an issue.
- **State Management (Frontend):** React Context for global state (auth). Local component state for most UI elements. Zustand for canvas editor specific complex state if `Fabric.js` internal state + component state becomes unwieldy.
- **"Infinite Canvas":** Fabric.js can handle large canvas dimensions. Panning/zooming will be important.
- **User-Friendliness (All Ages):**
  - Clear visual hierarchy (as in mockups).
  - Prominent buttons with both icons and text labels (as shown in editor mockup).
  - Intuitive drag-and-drop.
  - Minimize clutter.
- **Search on Dashboard:** Start with client-side filtering of displayed canvases. If data grows large, implement server-side search.
- **Admin Role:** Add a `role` column (e.g., 'admin', 'user') to the `users` table to manage admin access. The first admin user might need to be created manually in the DB or via a seed script.

This phased approach should allow for steady progress and the ability to adapt as development unfolds. The mockups provide excellent guidance for the UI, especially for the Dashboard and Canvas Editor.
