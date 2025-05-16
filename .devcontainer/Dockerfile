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

# Set `DEVCONTAINER` environment variable to help with orientation
ENV DEVCONTAINER=true

# Create workspace directory and set permissions
WORKDIR /workspace

# Install global packages that might be needed
RUN npm install -g nodemon

# No ARG or ENV definitions for application variables
# These will be provided by the .env file through Docker Compose
