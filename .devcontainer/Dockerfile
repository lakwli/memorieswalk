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

# Set up environment variables
ENV VITE_API_URL=http://localhost:3000/api
ENV DB_USER=node
ENV DB_HOST=postgres
ENV DB_NAME=photosharing
ENV DB_PASSWORD=node
ENV DB_PORT=5432
ENV JWT_SECRET=your_secure_jwt_secret_key_here
ENV PORT=3000
ENV NODE_ENV=development
ENV FRONTEND_URL=http://localhost:5173
