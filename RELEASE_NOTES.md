# Domainatrix v1.0.0 Release Notes

Domainatrix is a self-hostable domain name inventory, WHOIS diagnostic manager, and uptime monitor. It brings full visibility and scheduling control to your domain portfolios from a modern, responsive, and performance-optimized developer console.

---

## Key Features in v1.0.0

* **Operational Dashboard**: Monitor overall portfolio health, pending domain/SSL expirations, registrar distribution, host distribution, and notification coverage.
* **12-Month Expiry Timeline**: Interactive dashboard SVG visual representation of upcoming domain expirations.
* **Inline Domain CRUD**: Fast draft domain registration, duplicate warning alerts, tag attachments, and cascades-aware delete confirmations.
* **Enrichment Engine**: Perform full WHOIS, DNS (NS, MX, TXT, A, AAAA), SSL certificate, and host geolocation lookups with a single click.
* **Uptime Activity Grid**: Track micro-uptime response times and statuses with GitHub-style grid visuals and real-time sparklines.
* **Automated Alert Channels**: Trigger automatic status alerts (Discord/Slack webhooks and SMTP email notifications) on domain updates, expirations, and downtimes.
* **CSV/JSON Portability**: Import or export your entire portfolio with flat structures for spreadsheet manipulation or nested backups.
* **Subdomain Discovery**: Auto-detect subdomains using public CT logs (crt.sh) and active DNS wordlist HTTP probing.
* **Chrome UX Report (CrUX)**: Opt-in performance panel loading real Core Web Vitals directly on domain detail pages.
* **Deploy Anywhere**: Run locally as a Linux AppImage or Windows desktop executable, run on a VPS using PM2, or spin up with a lightweight multi-arch Docker container.

---

## Installation & Getting Started

Refer to our documentation files for detailed setup steps:
* For local development or quick runs: [README.md](https://github.com/pinkpixel-dev/domainatrix/blob/main/README.md)
* For VPS or headless deployments: [docs/self-hosting.md](https://github.com/pinkpixel-dev/domainatrix/blob/main/docs/self-hosting.md)

---

## GitHub Repository Details

### Repository Short Description
> A self-hostable domain portfolio manager, WHOIS tracker, and uptime monitor built with Next.js, Drizzle, and SQLite.

### Suggested Repository Tags
`domain-manager` · `self-hosted` · `uptime-monitor` · `whois-tracker` · `ssl-monitor` · `dns-checker` · `nextjs` · `drizzle-orm` · `electron-app` · `docker` · `developer-tools`
