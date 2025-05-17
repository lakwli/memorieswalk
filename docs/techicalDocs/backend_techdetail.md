# Backend Technical Details: My Canvases Dashboard & Editor

## 1. Overview

The backend is a Node.js/Express REST API that provides authentication, user management, and CRUD operations for canvases ("memories"). It uses JWT for authentication and exposes endpoints for frontend integration.

---

## 2. Main Files & Structure

- **Entry Point:**

  - `server/index.js`: Main Express server setup, middleware registration, and route mounting.

- **Authentication:**

  - `server/auth.js`: Core authentication logic (e.g., JWT token generation, user validation).
  - `server/routes/auth.js`: REST endpoints for login, registration, and token issuance.
  - `server/middleware/auth.js`: Express middleware for JWT validation and route protection.

- **Models:**

  - `server/models/User.js`: User schema/model for authentication and ownership.

- **Routes:**

  - `server/routes/memoryRoutes.js` & `server/routes/memory.js`: Endpoints for CRUD operations on memories/canvases.
  - `server/routes/canvasRoutes.js` & `server/routes/canvas.js`: Endpoints for canvas-specific operations.

- **Database:**

  - `server/db.js`: Database connection and query logic (e.g., PostgreSQL, SQLite, or other).
  - `database/schema.sql`: SQL schema for tables (users, memories, canvases, etc.).

- **Scripts:**

  - `server/scripts/`: Utility scripts for DB initialization and migration (e.g., `initDb.js`, `migrateCanvasToMemory.js`).

- **Testing:**
  - `server/tests/`: Contains backend test files (e.g., `auth.test.js`).

---

## 3. Authentication & Security

- **JWT Authentication:**
  - Users authenticate via `/auth/login` and receive a JWT token.
  - Protected routes use `auth.js` middleware to validate JWTs.
  - User registration and password management handled via `/auth/register` and related endpoints.

---

## 4. API Endpoints

- **Auth Endpoints:**

  - `POST /auth/login`: User login, returns JWT.
  - `POST /auth/register`: User registration.

- **Memory/Canvas Endpoints:**
  - `GET /memories`: List all memories for the authenticated user.
  - `POST /memories`: Create a new memory/canvas.
  - `GET /memories/:id`: Get a specific memory/canvas.
  - `PUT /memories/:id`: Update a memory/canvas.
  - `DELETE /memories/:id`: Delete a memory/canvas.
  - Similar endpoints for `/canvases` if canvas-specific logic is separated.

---

## 5. Integration & Relationships

- **Frontend Integration:**
  - Frontend services (`authService.js`, `memoryService.js`, `canvasService.js`) call backend endpoints, passing JWT tokens for protected routes.
- **Database:**
  - Models and routes interact with the database via `db.js` and SQL scripts.
- **Scripts:**
  - Migration and initialization scripts help manage schema changes and data consistency.

---

**Summary:**
The backend is a modular Node.js/Express REST API with JWT authentication, user and memory/canvas management, and a clear separation of concerns between authentication, routing, models, and database logic. It is designed for secure integration with the React/Chakra UI frontend and supports extensibility for future features.

For further details, see the referenced files or request a deeper dive into specific modules or flows.
