# Mirador Hotel — Local setup

Quick local setup using Docker Compose (MySQL, backend, frontend).

Prerequisites:
- Docker & Docker Compose installed

Start locally:
```bash
docker-compose up --build
```

Notes:
- Backend exposes port `8080`.
- Frontend is served on `5173` (proxied to nginx port 80 in the container).
- Default MySQL root password is `root` and database `bd_mirador`.
- Change `jwt.secret` in `docker-compose.yml` to a secure random value for production.
- You can override env vars by setting them in your shell or a `.env` file.

Useful commands:
```bash
# build only
docker-compose build

# stop
docker-compose down

# run in background
docker-compose up -d --build
```
