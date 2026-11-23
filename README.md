# AWS Task Tracker

A full-stack task tracker built with **React + Vite**, **Node.js + Express**, and **MySQL**, designed to be deployed on an **AWS EC2 Ubuntu** server behind **Nginx** with **PM2**.

Users can create, view, edit, complete, and delete tasks, search by title, filter by status, and see live totals for all, completed, and pending tasks.

---

## Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Project structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Local setup](#local-setup)
6. [API reference](#api-reference)
7. [Testing](#testing)
8. [Deploying to AWS EC2](#deploying-to-aws-ec2)
9. [Key implementation decisions](#key-implementation-decisions)
10. [Troubleshooting](#troubleshooting)

---

## Features

- Add, view, edit, and delete tasks (delete asks for confirmation)
- Mark tasks completed or pending with one click
- Search by title (debounced, case-insensitive) and filter by status
- Summary cards: total, completed, pending
- Priority badges (Low / Medium / High) and overdue indicator
- Loading spinners, error alerts with retry, success/error toasts
- Responsive layout: sidebar on desktop, slide-out menu and card list on phones
- Validation on both client and server, plus consistent JSON errors

Each task has: `id`, `title`, `description`, `status` (`PENDING` | `COMPLETED`), `priority` (`LOW` | `MEDIUM` | `HIGH`), `due_date`, `created_at`, `updated_at`.

---

## Architecture

```
 Browser (React SPA)
        │  HTTP (Axios, base URL from VITE_API_URL)
        ▼
 ┌──────────────────────────── EC2 ────────────────────────────┐
 │  Nginx :80                                                   │
 │   ├── /          → static files in /var/www/task-tracker     │
 │   └── /api/*     → proxy to 127.0.0.1:5000                   │
 │                                                              │
 │  Express API :5000  (kept alive by PM2)                      │
 │   routes → validation middleware → controllers → services    │
 │                                                │             │
 │                                    mysql2 connection pool    │
 │                                                ▼             │
 │  MySQL :3306  database: aws_task_tracker                     │
 └──────────────────────────────────────────────────────────────┘
```

Locally, the same pieces run separately: Vite on `:5173`, Express on `:5000`, MySQL on `:3306`.

---

## Project structure

```
aws-task-tracker/
├── backend/
│   ├── scripts/apiSmokeTest.js     # end-to-end API test (npm run test:api)
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js              # loads + validates .env
│   │   │   └── db.js               # MySQL connection pool
│   │   ├── controllers/            # HTTP in/out, no SQL
│   │   ├── middleware/
│   │   │   ├── validateTask.js     # input validation
│   │   │   └── errorHandler.js     # 404 + centralized error handler
│   │   ├── routes/                 # URL → middleware → controller
│   │   ├── services/taskService.js # all SQL (parameterized)
│   │   ├── utils/                  # ApiError, constants
│   │   ├── app.js                  # builds the Express app
│   │   └── server.js               # starts the server, graceful shutdown
│   ├── ecosystem.config.cjs        # PM2 config
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/             # Sidebar, StatsCards, TaskList, TaskForm, ...
│   │   ├── pages/                  # Dashboard, TaskDetails, TaskForm (add/edit), NotFound
│   │   ├── services/               # api.js (Axios instance), taskService.js
│   │   ├── hooks/                  # useTasks, useDebounce, useToast
│   │   ├── utils/format.js         # date helpers
│   │   ├── App.jsx                 # routes
│   │   ├── main.jsx                # entry point
│   │   └── index.css               # all styles
│   ├── .env.example
│   └── package.json
├── database/schema.sql
├── deploy/nginx.conf               # Nginx site config for EC2
├── .gitignore
└── README.md
```

---

## Prerequisites

| Tool    | Version            | Check            |
| ------- | ------------------ | ---------------- |
| Node.js | 20 or newer        | `node -v`        |
| npm     | comes with Node    | `npm -v`         |
| MySQL   | 8.0 or newer       | `mysql --version` |

---

## Local setup

### 1. Create the database

```bash
mysql -u root -p < database/schema.sql
```

On Windows PowerShell (where `<` redirection is not supported), use:

```powershell
Get-Content database/schema.sql | mysql -u root -p
```

Verify:

```bash
mysql -u root -p -e "USE aws_task_tracker; DESCRIBE tasks;"
```

**Alternative:** after creating `backend/.env` (step 2), run `npm run db:init` inside `backend/`. It applies the same `schema.sql` using the credentials from `.env`, so you don't type the password on the command line. It is safe to run repeatedly.

### 2. Configure and start the backend

```bash
cd backend
cp .env.example .env        # Windows: copy .env.example .env
```

Edit `backend/.env` and set `DB_PASSWORD` (and `DB_USER` if you are not using root). Then:

```bash
npm install
npm run dev                  # auto-restarts when files change
```

You should see:

```
[db] Connected to MySQL at localhost:3306/aws_task_tracker
[server] API listening on http://localhost:5000/api (development)
```

Check it: open <http://localhost:5000/api/health>.

### 3. Configure and start the frontend

In a second terminal:

```bash
cd frontend
cp .env.example .env         # Windows: copy .env.example .env
npm install
npm run dev
```

Open <http://localhost:5173>.

> `VITE_API_URL` is read at **build time** by Vite. If you change `.env`, restart `npm run dev`.

---

## API reference

Base URL: `http://localhost:5000/api` (locally) or `http://<your-server>/api` (EC2).

All responses are JSON with the same shape:

```jsonc
// success
{ "success": true, "message": "Task created successfully", "data": { ... } }

// error
{ "success": false, "message": "Validation failed", "errors": { "title": "Title is required" } }
```

| Method | Endpoint                 | Description                                 | Success |
| ------ | ------------------------ | ------------------------------------------- | ------- |
| GET    | `/api/health`            | API + database health                       | 200 (503 if DB down) |
| GET    | `/api/tasks`             | List tasks. Query: `search`, `status`       | 200 |
| GET    | `/api/tasks/stats`       | `{ total, completed, pending }`             | 200 |
| GET    | `/api/tasks/:id`         | Get one task                                | 200 |
| POST   | `/api/tasks`             | Create a task                               | 201 |
| PUT    | `/api/tasks/:id`         | Update a task (title required; omitted fields keep their value) | 200 |
| PATCH  | `/api/tasks/:id/status`  | Set status to `PENDING` or `COMPLETED`      | 200 |
| DELETE | `/api/tasks/:id`         | Delete a task                               | 200 |

**Validation rules**

| Field         | Rule |
| ------------- | ---- |
| `title`       | required string, 1–150 chars (trimmed) |
| `description` | optional string, max 5000 chars; `""` or `null` clears it |
| `status`      | `PENDING` or `COMPLETED` (case-insensitive), default `PENDING` |
| `priority`    | `LOW`, `MEDIUM`, or `HIGH` (case-insensitive), default `MEDIUM` |
| `due_date`    | optional, real calendar date in `YYYY-MM-DD`; `""` or `null` clears it |
| `:id`         | positive whole number |

**Error status codes:** `400` invalid input or malformed JSON · `404` task or route not found · `503` database unavailable · `500` unexpected error.

---

## Testing

### Automated API smoke test

With the backend running:

```bash
cd backend
npm run test:api
```

It runs about 30 checks: full CRUD, search, filter, stats, status toggling, and error cases (invalid id, missing task, bad priority, impossible date, malformed JSON, SQL-injection-style search, unknown route). It deletes the task it creates.

To test a deployed server: `API_URL=http://<ec2-ip>/api npm run test:api`.

### Sample requests (curl)

> On Windows use **Git Bash** for these, or replace `curl` with `curl.exe` in PowerShell and escape the JSON quotes.

```bash
API=http://localhost:5000/api

# Health
curl $API/health

# Create
curl -X POST $API/tasks -H "Content-Type: application/json" \
  -d '{"title":"Launch EC2 instance","description":"t3.micro, Ubuntu 24.04","priority":"HIGH","due_date":"2026-12-15"}'

# List all / search / filter
curl "$API/tasks"
curl "$API/tasks?search=ec2"
curl "$API/tasks?status=PENDING"
curl "$API/tasks?search=nginx&status=COMPLETED"

# Stats
curl $API/tasks/stats

# Get one
curl $API/tasks/1

# Update (send title + any fields to change)
curl -X PUT $API/tasks/1 -H "Content-Type: application/json" \
  -d '{"title":"Launch EC2 instance","priority":"MEDIUM","due_date":null}'

# Mark completed / pending
curl -X PATCH $API/tasks/1/status -H "Content-Type: application/json" -d '{"status":"COMPLETED"}'
curl -X PATCH $API/tasks/1/status -H "Content-Type: application/json" -d '{"status":"PENDING"}'

# Delete
curl -X DELETE $API/tasks/1

# Error cases
curl $API/tasks/abc                                   # 400 invalid id
curl $API/tasks/999999                                # 404 not found
curl -X POST $API/tasks -H "Content-Type: application/json" -d '{}'   # 400 title required
```

### Manual UI checklist

1. Add a task with only a title → appears in the list, totals update, success toast shows.
2. Try to save with an empty title → inline error, no request sent.
3. Click the checkbox → task moves to Completed, counts update.
4. Use **Pending** / **Completed** in the sidebar or the filter buttons → list filters, URL changes.
5. Type in the search box → list narrows after a short pause.
6. Open a task → details page shows created/updated timestamps.
7. Edit it → changes saved, `updated_at` changes.
8. Delete it → confirmation dialog, then task removed.
9. Stop the backend and refresh → a "Cannot reach the server" error with a **Retry** button.
10. Shrink the browser to phone width → hamburger menu and card layout.

### Database failure behaviour

If MySQL is stopped or the credentials are wrong, the API **keeps running**: `/api/health` returns `503` with `"database": "down"`, task endpoints return `503 Database is unavailable`, and the pool reconnects automatically once MySQL is back.

---

## Deploying to AWS EC2

These steps describe the deployment. Nothing in this repository creates AWS resources.

### 1. Launch the instance

- **AMI:** Ubuntu Server 24.04 LTS · **Type:** `t2.micro` / `t3.micro` (free tier eligible)
- **Key pair:** create/download a `.pem` key
- **Security group inbound rules:**
  - SSH `22` from **My IP** only
  - HTTP `80` from `0.0.0.0/0`
  - HTTPS `443` from `0.0.0.0/0` (if you add TLS later)
  - Do **not** open `5000` or `3306`; Nginx and the backend reach them locally.

Connect:

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

### 2. Install software

```bash
sudo apt update && sudo apt upgrade -y

# Node.js 22 LTS (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v

# MySQL, Nginx, Git
sudo apt install -y mysql-server nginx git

# PM2
sudo npm install -g pm2
```

### 3. Get the code onto the server

```bash
cd ~
git clone https://github.com/<you>/aws-task-tracker.git
cd aws-task-tracker
```

(Or copy it with `scp -r -i your-key.pem aws-task-tracker ubuntu@<EC2_PUBLIC_IP>:~` — exclude `node_modules`.)

### 4. Set up MySQL

```bash
sudo mysql_secure_installation     # answer the prompts; remove anonymous users and the test DB
```

Create the database and a dedicated app user (do not use root from the app):

```bash
sudo mysql < ~/aws-task-tracker/database/schema.sql
sudo mysql
```

```sql
CREATE USER 'task_app'@'localhost' IDENTIFIED BY 'A_Strong_Password_Here';
GRANT SELECT, INSERT, UPDATE, DELETE ON aws_task_tracker.* TO 'task_app'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 5. Configure and start the backend with PM2

```bash
cd ~/aws-task-tracker/backend
npm ci --omit=dev
cp .env.example .env
nano .env
```

Production `.env`:

```dotenv
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_USER=task_app
DB_PASSWORD=A_Strong_Password_Here
DB_NAME=aws_task_tracker
DB_PORT=3306
DB_CONNECTION_LIMIT=10
CORS_ORIGIN=http://<EC2_PUBLIC_IP>
```

```bash
chmod 600 .env                      # only your user can read the secrets
pm2 start ecosystem.config.cjs
pm2 logs task-tracker-api --lines 20
curl http://localhost:5000/api/health

# Restart automatically after a reboot
pm2 save
pm2 startup systemd                 # then run the sudo command it prints
```

### 6. Build the frontend

```bash
cd ~/aws-task-tracker/frontend
echo "VITE_API_URL=/api" > .env.production
npm ci
npm run build

sudo mkdir -p /var/www/task-tracker
sudo cp -r dist/* /var/www/task-tracker/
```

`VITE_API_URL=/api` makes the browser call the API on the same domain, so Nginx forwards it and no CORS is needed.

> On a 1 GB instance, `npm run build` can run out of memory. Either add swap (`sudo fallocate -l 1G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`) or build locally and upload `dist/`.

### 7. Configure Nginx

```bash
sudo cp ~/aws-task-tracker/deploy/nginx.conf /etc/nginx/sites-available/task-tracker
sudo ln -s /etc/nginx/sites-available/task-tracker /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Open `http://<EC2_PUBLIC_IP>` in your browser. Check the API through Nginx: `curl http://<EC2_PUBLIC_IP>/api/health`.

### 8. Updating after code changes

```bash
cd ~/aws-task-tracker && git pull

# backend
cd backend && npm ci --omit=dev && pm2 restart task-tracker-api

# frontend
cd ../frontend && npm ci && npm run build && sudo rm -rf /var/www/task-tracker/* && sudo cp -r dist/* /var/www/task-tracker/
```

### Useful PM2 / Nginx commands

```bash
pm2 status                      # process list
pm2 logs task-tracker-api       # live logs
pm2 restart task-tracker-api
sudo tail -f /var/log/nginx/error.log
sudo systemctl status nginx mysql
```

### Optional next steps

- Point a domain at the instance and add free HTTPS with Certbot: `sudo apt install certbot python3-certbot-nginx && sudo certbot --nginx`.
- Move the database to **Amazon RDS for MySQL** — only `DB_HOST`, `DB_USER`, and `DB_PASSWORD` change.
- Attach an Elastic IP so the public IP survives instance restarts.

---

## Key implementation decisions

- **Layered backend (routes → middleware → controllers → services).** Each layer has one job: routes map URLs, middleware validates, controllers handle HTTP, services hold the SQL. Changing the database code never touches HTTP code, and vice versa.
- **Parameterized queries everywhere.** Values are passed separately from SQL text (`WHERE id = ?`), so user input cannot alter a query. Search terms also escape `%` and `_` so they match literally.
- **Connection pool.** `mysql2` keeps up to `DB_CONNECTION_LIMIT` connections open and reuses them, and reconnects automatically after an outage.
- **`dateStrings: true`.** MySQL dates come back as plain strings (`"2026-12-31"`) instead of JavaScript `Date` objects, which avoids off-by-one-day bugs caused by time zones.
- **Express 5.** Errors thrown inside `async` route handlers go straight to the error handler, so controllers need no `try/catch`.
- **Centralized error handler.** One place converts any error into `{ success: false, message, errors? }` with the right status code: `ApiError` → its own code, invalid JSON → 400, MySQL connection errors → 503, anything else → 500. Stack traces are shown only in development.
- **Server starts even if MySQL is down.** That way `/api/health` can report the problem, and PM2 does not get stuck in a restart loop.
- **Validation twice.** The React form validates for fast feedback; the API validates again because any client (curl, Postman) can call it directly.
- **Single Axios instance + `VITE_API_URL`.** The API address is configured once; components call `services/taskService.js` and never build URLs themselves.
- **Status filter in the URL** (`/?status=PENDING`). Sidebar links, refresh, and the back button all work, and filtered views are bookmarkable.
- **Request cancellation.** `useTasks` aborts the previous request when filters change, so a slow old response can never overwrite newer results.
- **Nginx serves the SPA and proxies `/api`.** Frontend and API share one origin in production, so CORS is unnecessary and port 5000 stays private.

---

## Troubleshooting

| Symptom | Fix |
| ------- | --- |
| `[config] Missing required environment variables` | Create `backend/.env` from `.env.example`. |
| `ER_ACCESS_DENIED_ERROR` | Wrong `DB_USER` / `DB_PASSWORD` in `backend/.env`. |
| `ER_BAD_DB_ERROR` | The database does not exist; run `database/schema.sql`. |
| `ECONNREFUSED ...:3306` | MySQL is not running (`sudo systemctl start mysql`, or start the MySQL80 service on Windows). |
| `Port 5000 is already in use` | Another backend is still running (an old terminal, or PM2). Find it with `netstat -ano \| findstr :5000` (Windows) or `sudo lsof -i :5000` (Linux) and stop it, or change `PORT`. On Windows PowerShell: `Get-NetTCPConnection -LocalPort 5000 -State Listen \| % { Stop-Process -Id $_.OwningProcess }` |
| UI shows "Cannot reach the server" | Backend not running, or `VITE_API_URL` is wrong (restart Vite after changing it). |
| Browser console shows a CORS error locally | Add the frontend's origin to `CORS_ORIGIN` in `backend/.env` and restart the backend. |
| Refreshing `/tasks/5` on EC2 gives a 404 | The Nginx `try_files ... /index.html` line is missing. |
| `502 Bad Gateway` from Nginx | Backend is down: `pm2 status`, `pm2 logs task-tracker-api`. |
