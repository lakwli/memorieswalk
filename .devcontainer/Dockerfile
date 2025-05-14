FROM node:22

# Install basic development tools
RUN apt update && apt install -y less man-db sudo

# Ensure default `node` user has access to `sudo`
ARG USERNAME=node
RUN echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME \
    && echo "$USERNAME:node" | chpasswd

# Set `DEVCONTAINER` environment variable to help with orientation
ENV DEVCONTAINER=true

# Install PostgreSQL
RUN apt update && apt install -y postgresql postgresql-contrib

# Initialize PostgreSQL database
USER postgres
RUN /etc/init.d/postgresql start && \
    psql --command "CREATE USER node WITH SUPERUSER PASSWORD 'node';" && \
    createdb -O node photosharing

# Switch back to root for container initialization
USER root
