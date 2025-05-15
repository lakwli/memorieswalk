# Deployment Guide

## Database Setup

1. Ensure PostgreSQL is running and accessible
2. Set environment variables (DB_USER, DB_PASSWORD, etc.)
3. Run database initialization:

```bash
npm run setup
```

This will:

- Create required database tables
- Create default admin user (username: admin, password: admin)

## First Login

After deployment:

1. Log in with default credentials:
   - Username: admin
   - Password: admin
2. Change admin password immediately after first login

**Security Note:** Always change the default admin password in production!
