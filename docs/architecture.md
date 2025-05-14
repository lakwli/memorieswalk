# Photo Sharing Platform - Architectural Design

## 1. Overview & Philosophy

This document outlines the architectural design for a self-hosted photo sharing platform with a focus on creating an intuitive, user-friendly experience. Key features include photo uploading, a freeform canvas editor, and shareable links for viewing.

The architecture aims for initial simplicity with clear paths for future refactoring and scaling. It supports separate deployment of frontend and backend components.

## 2. Frontend (Client-Side)

*   **Framework:** React (with Vite for build tooling).
*   **Core UI & Logic:**
    *   **Canvas Editor:** A dedicated JavaScript canvas library (e.g., Fabric.js, Konva.js) will be used for object manipulation (photos, text, drawings), resizing, rotation, layering, and serialization.
    *   **State Management:** React Context API for global state (e.g., user authentication). For complex canvas state, Zustand or Redux Toolkit might be considered if needed.
    *   **Routing:** React Router for navigation between dashboard, canvas editor, and shared views.
    *   **UI Components:** Custom components, potentially styled with Tailwind CSS or a lightweight component library.
    *   **File Uploads:** User-friendly drag & drop and file selection (e.g., React Dropzone).
*   **API Communication:** `fetch` API or `axios` for interacting with the backend.
*   **Auto-Save:** Frontend will periodically send canvas state to the backend.

## 3. Backend (Server-Side)

*   **Language/Framework:** Node.js with Express.js.
*   **API Design:** RESTful API.
    *   **Key Endpoints:**
        *   User management (admin-only).
        *   Authentication (login/logout).
        *   Canvas CRUD (Create, Read, Update, Delete), including content saving and auto-save.
        *   Share link generation.
        *   Photo uploading.
        *   Serving canvas data for shared views.
*   **Photo Processing:** A library like `sharp` for generating thumbnails.

## 4. Data Storage

*   **Database (Metadata & Canvas Structure):**
    *   **Primary Choice:** PostgreSQL.
        *   User accounts, canvas metadata (title, timestamps, owner).
        *   Canvas elements (photos, text, drawings with properties) stored as JSONB for flexibility.
    *   **Alternative:** MySQL or a NoSQL database like MongoDB if preferred.
*   **Photo Storage (Uploaded Images & Thumbnails):**
    *   **Primary Choice:** Local filesystem on the server (e.g., in an `uploads/` directory). Path should be configurable.

## 5. Authentication & Authorization

*   **Strategy:** JSON Web Tokens (JWT).
    *   Admin creates user accounts.
    *   Users log in to receive a JWT.
    *   JWT sent in `Authorization` header for protected API requests.
*   **Middleware:** Backend middleware to protect routes and ensure users can only access/modify their own data.
*   **Shared Links:** Unique, unguessable tokens for view-only access without login.

## 6. Key Architectural Considerations

*   **Auto-Save:** Frontend periodically sends canvas state to the backend.
*   **Thumbnail Generation:**
    *   Option 1 (Simpler): Frontend sends a data URL of the canvas view as a thumbnail.
    *   Option 2 (Robust): Backend uses a headless browser or image library to generate from canvas data.
*   **Shareable Links:** Unique, random strings stored with canvas metadata.

## 7. Folder Structure (Simplified Monorepo)

A monorepo structure for development convenience, allowing separate builds and deployments.

```
/workspaces/photosharing/
├── src/                            # FRONTEND (React Application)
│   ├── components/
│   ├── pages/
│   ├── services/ (API calls)
│   └── ... (other React app files)
├── server/                         # BACKEND (Node.js/Express.js Application)
│   ├── package.json                # Backend's own dependencies
│   ├── index.js                    # Main backend file (Express app, routes, controllers)
│   ├── .env                        # Backend environment variables
│   └── uploads/                    # (gitignored) Storage for uploaded files
├── package.json                    # Root package.json (primarily for frontend)
├── vite.config.js
└── ... (other project files: .gitignore, docs/, etc.)
```

## 8. Deployment Strategy

*   **Frontend:** Built into static assets (HTML, CSS, JS) and deployable to static hosting services like Netlify, Vercel, or GitHub Pages.
*   **Backend:** Deployable as a Node.js application to a personal server, VPS, or cloud platforms (e.g., Heroku, AWS, DigitalOcean).
*   **Connection:** Frontend configured via environment variables to point to the deployed backend API URL.
*   **CORS:** Backend must be configured to allow requests from the frontend's domain.

## 9. Docker Support

*   **Backend:** Easily containerized using a `Dockerfile` in the `server/` directory for consistent deployment.
*   **Frontend:** Can be Dockerized (e.g., served via Nginx) if self-hosting is preferred over static hosting platforms.
*   **Local Development:** `docker-compose.yml` can be used to manage backend, database, and other services locally.

## 10. High-Level System Diagram

```mermaid
graph TD
    subgraph User Browser
        A[React Frontend App]
        A -- HTTPS (API Calls) --> B
        A -- Serves --> UserDevice[User's Device]
    end

    subgraph Server (Self-Hosted)
        B[Node.js/Express.js Backend API]
        B -- Manages Users/Canvas Metadata --> C[PostgreSQL Database]
        B -- Stores/Retrieves Canvas Elements (JSONB) --> C
        B -- Stores/Retrieves Photos --> D[Local Filesystem Storage for Photos/Thumbnails]
        B -- Handles Authentication --> C
    end

    Admin[Admin User] -- Manages Accounts via Frontend --> A
    UserDevice -- Views Shared Canvas (No Login) --> A
    UserDevice -- Interacts (Login, Upload, Edit) --> A
```
---
