# MERN Notes: Dockerized with Docker Compose

A small notes app (React, Express, MongoDB) packaged as three containers and started with a single `docker compose up`. The app itself is simple on purpose. The focus of this repository is the container setup: Dockerfiles, an nginx reverse proxy, network segmentation, an authenticated database with credentials kept in `.env`, a persistent volume, and health checks.

![Notes app](docker-compose-project/Screenshots/d-notes1.jpeg)

## Architecture

```
                 front network                back network
Browser --> frontend (nginx) --> backend (Express) --> mongo (MongoDB)
            3000 -> 80           5000                  27017
            published            internal              internal
```

| Service | Image | Networks | Role |
|---|---|---|---|
| `frontend` | built from `frontend/Dockerfile` | `front` | Serves the React build with nginx and proxies `/api` to the backend |
| `backend` | built from `backend/Dockerfile` | `front`, `back` | REST API for notes (Express + Mongoose) |
| `mongo` | `mongo:7` | `back` | Database with authentication, data stored in a named volume |

## Key design decisions

- **Only the frontend is published.** The backend and the database have no `ports` mapping, so they are reachable only from inside the Compose networks.
- **Two networks.** `front` connects nginx and the backend. `back` connects the backend and MongoDB. The frontend container cannot reach the database at all.
- **nginx as a reverse proxy.** The browser calls relative paths like `/api/notes`, and nginx forwards them to `http://backend:5000`. The browser never needs the backend hostname, and no CORS configuration is required.
- **Multi-stage frontend build.** Node builds the React app in the first stage. The final image contains only nginx and the static files.
- **Service names as hostnames.** Compose provides DNS by service name, so the backend connects to `mongo:27017` and nginx reaches `backend:5000`.
- **Credentials from `.env`.** MongoDB authentication is enabled, and the username and password are read from a `.env` file that is not committed. Compose fails fast if they are missing.
- **Persistent data.** MongoDB writes to `/data/db`, which is mounted from the named volume `mongodata`.
- **Health-based start order.** `mongo` has a health check (`mongosh` ping), the backend has one too (`/api/health`), and each service waits for the previous one with `condition: service_healthy`.
- **Restart policy.** All services use `restart: unless-stopped`.
- **Layer caching.** In both Dockerfiles `package.json` is copied and installed before the source code, so dependencies are not reinstalled on every code change.

## Project structure

```
.
├── compose.yaml
├── .env.example            # required variables (the real .env is not committed)
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   ├── server.js
│   └── src/
│       ├── config/db.js
│       ├── models/Note.js
│       └── routes/notes.js
└── frontend/
    ├── Dockerfile          # multi-stage: build + nginx
    ├── nginx.conf
    ├── .dockerignore
    ├── package.json
    ├── vite.config.js
    └── src/
```

## Getting started

**Prerequisites:** Docker with Docker Compose v2 (`docker compose version`).

```bash
git clone https://github.com/Nimrah-dev/docker-compose-project.git
cd docker-compose-project

# create the .env file with a random password (see .env.example)
echo "MONGO_ROOT_USER=notesadmin" > .env
echo "MONGO_ROOT_PASSWORD=$(openssl rand -hex 12)" >> .env

docker compose up -d --build
docker compose ps
```

Open **http://localhost:3000**. `mongo` and `backend` should show as `healthy`, and `frontend` as `Up`.

![docker compose ps](Screenshots/docker-compose.jpeg)

To stop:

```bash
docker compose down        # removes containers and networks, keeps the data
docker compose down -v     # also removes the volume (deletes all notes)
```

## Configuration

Values are read from `.env` (see `.env.example`):

| Variable | Used by | Purpose |
|---|---|---|
| `MONGO_ROOT_USER` | `mongo`, `backend` | MongoDB root username |
| `MONGO_ROOT_PASSWORD` | `mongo`, `backend` | MongoDB root password |

The backend receives these environment variables from `compose.yaml`:

| Variable | Value | Purpose |
|---|---|---|
| `PORT` | `5000` | Port the Express server listens on |
| `MONGO_URI` | `mongodb://<user>:<password>@mongo:27017/notesdb?authSource=admin` | MongoDB connection string (`mongo` is the service name) |

The `MONGO_INITDB_ROOT_*` variables only take effect when the data volume is empty. To change the credentials later, run `docker compose down -v` (this deletes the data) and start again.

## Verify the setup

```bash
curl localhost:3000/api/health
curl -X POST localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -d '{"title":"test","content":"hello"}'
curl localhost:3000/api/notes
```

These requests travel through nginx, the backend, and MongoDB.

**Network isolation**

```bash
docker compose exec backend ping -c 1 mongo     # works: same network
docker compose exec frontend ping -c 1 mongo    # fails: frontend cannot see the database
curl localhost:5000/api/health                  # fails: backend is not published
```

**Authentication**

```bash
# without credentials: "requires authentication"
docker compose exec mongo mongosh notesdb --quiet --eval "db.notes.find()"

# with credentials: returns the notes
docker compose exec mongo sh -c 'mongosh -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin notesdb --quiet --eval "db.notes.find()"'
```

**Persistence:** add a few notes, run `docker compose down` and `docker compose up -d`, and the notes are still there. Run `docker compose down -v` instead and they are gone.

## Security notes

- The `.env` file is listed in `.gitignore` and `.dockerignore`, so credentials are never committed or baked into an image.
- MongoDB requires authentication, and it is only reachable from the backend.
- Do not run `docker compose config` and share its output, because it prints resolved values including the password.
- This is a learning setup. For a real deployment, use a dedicated database user with limited permissions instead of the root user, and put TLS in front of the frontend.

## Published images

Pre-built images are available on Docker Hub:

```bash
docker pull nimrahsaif/notes-backend:1.0
docker pull nimrahsaif/notes-frontend:1.0
```
To run the published images without building (only `compose.deploy.yaml` and a `.env` are needed):

```bash
docker compose -f compose.deploy.yaml up -d
```

For development, `compose.yaml` uses `build:` so changes are built from source. A machine that only needs to run the app can use `image:` entries instead, and needs just a compose file and a `.env`, with no source code.

## API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/notes` | List notes |
| POST | `/api/notes` | Create a note (`title`, `content`) |
| PUT | `/api/notes/:id` | Update a note |
| DELETE | `/api/notes/:id` | Delete a note |

## Useful commands

```bash
docker compose logs -f backend          # follow logs of one service
docker compose ps -a                    # include stopped containers
docker compose up -d --build            # rebuild after code changes
docker compose config --quiet           # validate the compose file without printing values
docker images                           # compare image sizes
```

## What I practiced

- Writing Dockerfiles (`FROM`, `WORKDIR`, `COPY`, `RUN`, `EXPOSE`, `CMD`) and using `.dockerignore`
- Multi-stage builds to keep the frontend image small
- Container networking: DNS by service name, separate `front` and `back` networks, publishing only what is needed
- Named volumes for persistent database data
- Securing MongoDB with authentication and keeping credentials in `.env` with `.env.example` as a template
- Health checks and `depends_on` with `service_healthy`, plus restart policies
- Tagging and pushing images to Docker Hub
- Debugging with `docker compose logs`, `exec`, `ps -a`, and `config`

## Possible improvements

- Deploy the stack to a cloud VM (for example on Azure) using the published images
- Add a CI pipeline (GitHub Actions) that builds and pushes the images on every push
- Terminate HTTPS in front of the frontend
- Automate MongoDB backups with `mongodump`
