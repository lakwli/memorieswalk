FROM node:22

# Install basic development tools
RUN apt update && apt install -y \
    less \
    man-db \
    sudo \
    postgresql-client

# Ensure default `node` user has access to `sudo` and set password
ARG USERNAME=node
RUN echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME \
    && echo "$USERNAME:node" | chpasswd

# Note: We don't need to install full PostgreSQL server here
# because we're using a separate postgres container.
# The postgres container automatically:
# 1. Creates the database from POSTGRES_DB
# 2. Creates the user from POSTGRES_USER
# 3. Sets the password from POSTGRES_PASSWORD
# We only need postgresql-client for the pg_isready health check

# Set `DEVCONTAINER` environment variable to help with orientation
ENV DEVCONTAINER=true
