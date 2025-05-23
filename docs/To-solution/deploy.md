Use a single Docker image for app (frontend + backend)

Include DB initialization via init.sql inside the image

Use Docker Compose to deploy both app and Postgres together

Keep server.env and client.env separate, plus db.env for DB container

Minimize maintenance and avoid manual steps as much as possible

1.  Repository Structure (Your Source)
    repo/
    ├── backend/
    ├── frontend/
    ├── db/
    │ └── init.sql
    ├── scripts/
    │ └── docker-entrypoint.sh
    ├── Dockerfile
    └── .github/
    └── workflows/
    └── docker-build.yml

2.  Dockerfile (for Building App Image)
    FROM node:20

    WORKDIR /app

    # Copy backend and frontend build output

    COPY backend/ /app/backend/
    COPY frontend/dist/ /app/public/

    # Copy DB init and startup script

    COPY db/init.sql /app/init.sql
    COPY scripts/docker-entrypoint.sh /app/docker-entrypoint.sh
    RUN chmod +x /app/docker-entrypoint.sh

    EXPOSE 3000

    ENTRYPOINT ["/app/docker-entrypoint.sh"]

3.  docker-entrypoint.sh (App Startup Logic)
    #!/bin/bash
    set -e

    # Wait for Postgres

    until pg_isready -h "$DB_HOST" -U "$DB_USER"; do
    echo "Waiting for Postgres..."
    sleep 2
    done

    # Run DB init script (ignore errors if already applied)

    psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f /app/init.sql || true

    # Start backend server

    exec node /app/backend/server.js

4.  GitHub Action (.github/workflows/docker-build.yml)
    name: Build App Image

    on:
    push:
    branches: [main]

    jobs:
    build:
    runs-on: ubuntu-latest
    steps: - uses: actions/checkout@v3

        - name: Set up Docker Buildx
            uses: docker/setup-buildx-action@v2

        - name: Log in to DockerHub
            uses: docker/login-action@v2
            with:
            username: ${{ secrets.DOCKER_USER }}
            password: ${{ secrets.DOCKER_PASS }}

        - name: Build & Push Image
            uses: docker/build-push-action@v4
            with:
            context: .
            push: true
            tags: yourname/photo-app:latest

5.  What You Ship to End Users
    deploy/
    ├── docker-compose.yml
    ├── env/
    │ ├── server.env # Backend config (e.g. DB connection, JWT keys)
    │ ├── client.env # Frontend config (e.g. PUBLIC_BASE_URL)
    │ └── db.env # Postgres container init (username, password, db name)
    └── run.sh # Script to deploy everything

6.  docker-compose.yml (in deploy/)
    version: "3.8"

    services:
    app:
    image: yourname/photo-app:latest
    env_file: - ./env/server.env - ./env/client.env
    depends_on: - db
    ports: - "3000:3000"

    db:
    image: postgres:15
    env_file: - ./env/db.env
    volumes: - db_data:/var/lib/postgresql/data

    volumes:
    db_data:

7.  run.sh Script (in deploy/)
    #!/bin/bash
    set -e

    echo "Stopping existing containers..."
    docker compose down

    echo "Pulling latest images..."
    docker pull yourname/photo-app:latest
    docker pull postgres:15

    echo "Starting containers..."
    docker compose up -d

8.  Example .env Files (User Customizable)
    env/server.env
    DB_HOST=db
    DB_PORT=5432
    DB_USER=youruser
    DB_PASS=yourpass
    DB_NAME=photodb
    JWT_SECRET=secret

    env/client.env
    PUBLIC_BASE_URL=https://yourdomain.com

    env/db.env
    POSTGRES_USER=youruser
    POSTGRES_PASSWORD=yourpass
    POSTGRES_DB=photodb

9.  Instructions for Users (README.md)
    Download the deployment bundle.

    Copy and configure the .env files inside deploy/env/.

    Run bash run.sh.

    Open browser at http://localhost:3000 (or set up your own domain).

    You’re done!
