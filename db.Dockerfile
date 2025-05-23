FROM postgres:16-alpine
COPY database/schema.sql /docker-entrypoint-initdb.d/schema.sql
ENV POSTGRES_USER: node
ENV POSTGRES_PASSWORD: node
ENV POSTGRES_DB: memorieswalk