# Domainatrix Self-Hosting Guide

Domainatrix is designed to be easily self-hosted. You can run it as a lightweight Docker container, a native systemd/PM2 background service on a Linux VPS, or locally as a packaged desktop application.

---

## 1. Environment Variable Reference

Domainatrix is configured using environment variables. When self-hosting, configure these variables in your Docker container or target environment.

| Variable | Description | Example / Default | Required? |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Mode to run the application in. | `production` | Recommended |
| `PORT` | The network port the server binds to. | `8765` | Optional (default: `3000` in Docker) |
| `HOSTNAME` | The host address the server binds to. | `127.0.0.1` or `0.0.0.0` | Optional (default: `0.0.0.0` in Docker) |
| `DB_FILE_NAME` | The absolute or relative path to the SQLite DB file. | `/app/data/domainatrix.sqlite` | Optional (default: `./data/domainatrix.sqlite`) |
| `CRON_SECRET` | A secure bearer token to authorize scheduled checks. | `generate-with-openssl` | **Required** for background cron jobs |
| `CRUX_API_KEY` | Google PageSpeed/Chrome UX Report API Key for Core Web Vitals. | `AIzaSy...` | Optional (hides widget if omitted) |
| `NOTIFICATION_WEBHOOK_URL` | Webhook URL for Slack/Discord notification delivery. | `https://discord.com/api/webhooks/...` | Optional (takes priority over email) |
| `SMTP_HOST` | Hostname of the outgoing SMTP server. | `smtp.fastmail.com` | Optional (used for email alerts) |
| `SMTP_PORT` | Port of the outgoing SMTP server. | `587` | Optional (defaults to `587`) |
| `SMTP_SECURE` | Use SSL/TLS for connection. Sets true for SSL (465). | `false` | Optional |
| `SMTP_USER` | SMTP username for authentication. | `alerts@example.com` | Optional |
| `SMTP_PASS` | SMTP password (or app password) for auth. | `smtp-app-password` | Optional |
| `NOTIFICATION_EMAIL_FROM` | Sender display name and address for emails. | `Domainatrix <alerts@example.com>` | Optional |
| `NOTIFICATION_EMAIL_TO` | Target email address to receive alerts. | `recipient@example.com` | Optional |

---

## 2. Docker & Docker Compose Deployment (Recommended)

Docker is the easiest way to deploy Domainatrix with persistent data and isolated dependencies.

### Step 1: Prepare the Directory
Create a clean directory for Domainatrix and copy your `.env` configuration file into it.

```bash
mkdir -p ~/domainatrix/data
cd ~/domainatrix
```

### Step 2: Create a `docker-compose.yml`
Save the following configuration as `docker-compose.yml`:

```yaml
services:
  domainatrix:
    image: pinkpixeldev/domainatrix:latest
    container_name: domainatrix
    restart: unless-stopped
    ports:
      - "8765:3000"
    environment:
      - NODE_ENV=production
      - DB_FILE_NAME=/app/data/domainatrix.sqlite
      - PORT=3000
      - HOSTNAME=0.0.0.0
      - CRON_SECRET=your_super_secure_cron_secret
      # Optional: Webhook URL for Discord/Slack
      # - NOTIFICATION_WEBHOOK_URL=https://discord.com/api/webhooks/...
      # Optional: Core Web Vitals Key
      # - CRUX_API_KEY=your_google_ux_api_key
    volumes:
      - ./data:/app/data
```

### Step 3: Run the Container
Start the container in detached (background) mode:

```bash
docker compose up -d
```

Domainatrix will now be accessible at `http://localhost:8765`.

---

## 3. Native Linux VPS Deployment (Node.js + PM2 / Systemd)

If you prefer to run Domainatrix natively without containerization:

### Step 1: Install System Prerequisites
Ensure Node.js (v20+ recommended) and SQLite CLI are installed on your server:

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nodejs npm sqlite3
```

### Step 2: Build the Production Standalone App
Clone the repository, install dependencies, and compile the production bundle:

```bash
git clone https://github.com/pinkpixel-dev/domainatrix.git
cd domainatrix
npm install
npm run build
```

The production standalone build will be compiled inside `.next/standalone/`.

### Step 3: Deploy with PM2
PM2 is a production process manager that keeps your application alive:

```bash
# Install PM2 globally
sudo npm install -g pm2

# Create a PM2 ecosystem file or run directly with env vars
pm2 start .next/standalone/server.js --name domainatrix --env PORT=8765,DB_FILE_NAME=./data/domainatrix.sqlite,CRON_SECRET=your_cron_secret

# Save the process list so it restarts on system bootup
pm2 save
pm2 startup
```

---

## 4. Setting Up Scheduled Monitoring (Cron Jobs)

To make Domainatrix check your domain statuses, SSL certificates, and uptime automatically, you must schedule a curl request to trigger the cron endpoint.

### Step 1: Select a Cron Schedule
Decide how often you want checks to run:
* **Uptime checks** (lightweight HTTP requests): Recommended every 5 to 15 minutes.
* **Portfolio checks** (heavyweight WHOIS/DNS/SSL queries): Recommended once or twice daily to avoid rate-limiting from public WHOIS registries.

### Step 2: Configure a System Cron
Open your crontab editor:

```bash
crontab -e
```

Add the following entries (replacing `your_super_secure_cron_secret` and port/domain accordingly):

```cron
# Trigger HTTP uptime checks every 5 minutes
*/5 * * * * curl -fsS -X POST -H "Authorization: Bearer your_super_secure_cron_secret" http://127.0.0.1:8765/api/monitoring/uptime/run > /dev/null 2>&1

# Trigger full WHOIS, DNS, and SSL portfolio updates once a day at midnight
0 0 * * * curl -fsS -X POST -H "Authorization: Bearer your_super_secure_cron_secret" http://127.0.0.1:8765/api/monitoring/checks/cron > /dev/null 2>&1
```

---

## 5. Linux Desktop AppImage Usage

If you prefer to run Domainatrix as a standalone desktop utility on your local machine:

1. Download the latest `.AppImage` package from the GitHub Releases page.
2. Grant execution permissions:
   ```bash
   chmod +x Domainatrix-1.0.0.AppImage
   ```
3. Run the application:
   ```bash
   ./Domainatrix-1.0.0.AppImage
   ```

All application state, history, and domain settings are stored locally in:
`~/.config/domainatrix/data/domainatrix.sqlite`
