# Frontend Technical Details: My Canvases Dashboard & Editor

## 1. App Structure & Main Files

- **Entry Points:**

  - `src/main.jsx`: Bootstraps the React app, wraps it with ChakraProvider (for theming), and sets up the router.
  - `src/App.jsx`: Main app component, includes layout and routing.

- **Layout & Navigation:**

  - `src/layouts/MasterLayout.jsx`: Wraps the app with `Header`, `Footer`, and main content area.
  - `src/layouts/Header.jsx` & `Footer.jsx`: Top and bottom navigation/UI elements.

- **Routing:**

  - `src/routes/AppRoutes.jsx`: Defines app routes, including protected and public pages.
  - `src/components/ProtectedRoute.jsx`: Restricts access to authenticated users.

- **Pages:**

  - `src/pages/DashboardPage.jsx`: Displays a list of user "memories" (canvases), fetched via `memoryService`.
  - `src/pages/MemoryEditorPage.jsx`: Editor for individual canvases/memories, supports editing, uploading, and sharing.
  - `src/pages/LoginPage.jsx`: User authentication UI.

- **Error Handling:**

  - `src/components/ErrorBoundary.jsx`: Catches and displays errors in the UI.

- **Other Components:**
  - `src/AutoCompleteComponent.jsx`: UI component for autocomplete functionality.

---

## 2. Theme System

- **Chakra UI:**
  - The app uses Chakra UI for consistent styling and theming.
  - `src/theme/index.js`: Customizes the Chakra theme (colors, fonts, etc.).
  - Theme is applied globally via `ChakraProvider` in `main.jsx`.

---

## 3. Authentication

- **Context:**
  - `src/context/AuthContext.jsx`: Provides authentication state and methods to the app.
- **Service Layer:**
  - `src/services/authService.js`: Handles login, logout, token storage, and user info.
- **Protected Routes:**
  - `ProtectedRoute.jsx` ensures only authenticated users can access certain pages.
- **Backend:**
  - `server/auth.js`, `server/routes/auth.js`: REST endpoints for login, registration, and JWT token issuance.
  - `server/middleware/auth.js`: Middleware for JWT validation.

---

## 4. API Service Layer

- **Frontend Services:**

  - `src/services/memoryService.js`: CRUD operations for "memories" (canvases).
  - `src/services/canvasService.js`: (If present) Handles canvas-specific API calls.
  - Services use fetch/axios to communicate with backend endpoints, passing JWT tokens as needed.

- **Backend API:**
  - `server/routes/memoryRoutes.js`, `server/routes/canvasRoutes.js`: Define REST endpoints for memory/canvas CRUD.
  - `server/models/User.js`: User model for authentication and ownership.
  - `server/index.js`: Main Express server entry point.

---

## 5. Integration & Relationships

- **Frontend-Backend:**
  - Frontend services call backend REST endpoints for authentication and data.
  - JWT tokens are used for protected API calls.
- **Theming:**
  - Chakra UI theme is shared across all components for a unified look.
- **Docs:**
  - `docs/techicalDocs/implementation-phase2.md` and related files provide implementation details, design rationale, and API documentation.

---

**Summary:**
The app is a React/Chakra UI SPA with a dashboard for managing canvases ("memories"), a canvas editor, and authentication. It uses a clear separation of concerns: layout, routing, authentication context, service layers for API calls, and a custom theme. The backend is a Node/Express REST API with JWT authentication and endpoints for user, memory, and canvas management.

If you need a deeper dive into any specific part (e.g., code samples, flow diagrams, or file-by-file breakdown), see the referenced files or request further details.
