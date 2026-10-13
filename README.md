## Evidence

### Storage and persistence
- Project records are stored in SQLite through `database.js`.
- Data persists after the server is stopped and restarted.
- Existing browser `localStorage` data is not automatically migrated to SQLite.

### API verification
- **GET** `/api/projects` — retrieves projects.
- **POST** `/api/projects` — creates a project.
- **PUT** `/api/projects/:id` — updates a project.
- **DELETE** `/api/projects/:id` — deletes a project.
- Invalid input returns a client error, and requests for nonexistent projects return a not-found error.

### Test results
- Command: `npm.cmd test`
- Tests passed: 1
- Tests failed: 0
- Verified CRUD operations, input validation, persistence after server restart, API errors, and static frontend delivery.

### Manual verification
Created a project through the API, retrieved it, updated its status, deleted it, and confirmed that remaining project records survived a server restart.