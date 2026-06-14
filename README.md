# Domainatrix

<p align="center">
  <img src="./icon.png" alt="Domainatrix logo" width="300" />
</p>

Domainatrix is a self-hostable domain portfolio manager, diagnostic tracker, and uptime monitor. Build a clean overview of your entire domain portfolio, track WHOIS changes, diagnose DNS records, check SSL certificate health, discover hidden subdomains, and monitor real-time HTTP uptime from a single desktop or server console.

Designed specifically for developers, designers, and domain collectors who want full privacy and control without paying for complex external platforms.

---

## Key Features

* **Rich Visual Dashboard**: Monitor overall portfolio health, pending domain and SSL expirations, registrar distribution, host distribution, and notification coverage.
* **12-Month Expiry Timeline**: An interactive SVG visual timeline mapping out domain expirations over the coming year by urgency.
* **One-Click Enrichment**: Fetch live WHOIS, DNS (NS, MX, TXT, IPv4, IPv6), SSL certificate details, and host geolocation (ISP, Org, City, Country) in a single click.
* **Uptime Monitoring**: Run lightweight HTTP uptime checks, monitor response latency, and review a dense, GitHub-style uptime history grid.
* **Subdomain Discovery**: Scan and locate active subdomains automatically using crt.sh Certificate Transparency logs and custom DNS wordlist HTTP probing.
* **Notification Preferences**: Configure granular per-domain alerts. Receive updates on expirations, SSL changes, IP shifts, registrar alterations, or downtimes.
* **Multiple Notification Channels**: Deliver automated JSON payloads to Discord/Slack webhooks or SMTP emails.
* **Chrome UX Report (CrUX)**: Opt-in performance panel displaying real-world Core Web Vitals (LCP, CLS, INP) gauges for monitored domains.
* **CSV & JSON Portability**: Back up or restore your portfolio via nested JSON exports or flat CSV lists.
* **Documentation**: [https://domainatrix.xyz](https://domainatrix.xyz)

---

## Preview

<p align="center">
  <img src="./screenshots/screenshot1.png" alt="Domainatrix Dashboard" width="700" />
</p>

<p align="center">
  <img src="./screenshots/screenshot2.png" alt="Domainatrix Inventory" width="700" />
</p>

<p align="center">
  <img src="./screenshots/screenshot4.png" alt="Domainatrix Details" width="700" />
</p>

---

## Desktop App (Electron)

Domainatrix runs as a fully integrated desktop client built with Electron.

**Download the latest release:**

**Linux (x64)**:
- [`deb`](https://github.com/pinkpixel-dev/domainatrix/releases/download/v1.0.0/domainatrix_1.0.0_amd64.deb)
- [`rpm`](https://github.com/pinkpixel-dev/domainatrix/releases/download/v1.0.0/domainatrix-1.0.0.x86_64.rpm)
- [`AppImage`](https://github.com/pinkpixel-dev/domainatrix/releases/download/v1.0.0/Domainatrix-1.0.0.AppImage)
**Windows (x64)**:
- [`exe`](https://github.com/pinkpixel-dev/domainatrix/releases/download/v1.0.0/Domainatrix.Setup.1.0.0.exe)

---

## Self-Hosting (Docker)

Run headless as a lightweight Docker container or native Node service on any Linux VPS.

Refer to the detailed **[Self-Hosting Guide](docs/self-hosting.md)** for:
* Docker Compose installation
* Background cron configurations for automated uptime and WHOIS checks
* PM2 / Systemd process management on a Linux VPS

---

## Running Locally (Development)

### Prerequisites

Ensure you have Node.js (v20+) and npm installed on your system.

### Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/pinkpixel-dev/domainatrix.git
cd domainatrix
npm install
```

Copy the example environment configuration and edit it with your own values:

```bash
cp .env.example .env
```

### Generate the Database Schema

Initialize migrations and set up your local SQLite database:

```bash
npm run db:generate
npm run db:migrate
```

### Run the Dev Server

Launch the local Next.js web application:

```bash
npm run dev
```

Open your browser to `http://localhost:8765`.

### Run Desktop Client in Development

Rebuild native SQL wrappers and launch the local Electron shell:

```bash
npm run electron:dev
```

### Compile Desktop Packages

Build production-ready desktop installers for Linux (`.deb`, `.rpm`, `.AppImage`) or Windows (`.exe`):

```bash
# Compile packages for your host platform
npm run electron:build

# Specific platform builds
npm run electron:build:linux
npm run electron:build:win
```

Installers and packages will compile into `dist/electron/`.

---

## License

Domainatrix is licensed under the Apache 2.0 License. See the [LICENSE](file:///home/sizzlebop/PINKPIXEL/PROJECTS/CURRENT/domainatrix/LICENSE) file for more information.

*Made with 💖 by Pink Pixel.*
