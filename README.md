# 🚀 Strato Companion (MCP Server & CLI)

Ein intelligenter **Companion & MCP Server** für **Strato HiDrive** und **Strato Webhosting**.

Verbindet deine Strato Cloud-Infrastruktur mit KI-Assistenten (wie Antigravity / Claude) und bietet eine mächtige CLI für automatisierte Backups, Health-Monitoring und SSH-Verwaltung.

---

## 🌟 Features

* **🩺 Health & SSL Monitoring**: Überprüfe HTTP-Erreichbarkeit, Antwortzeiten und SSL-Zertifikate.
* **📂 HiDrive WebDAV Integration**: Durchsuche, erstelle und lade Dateien auf deinen Strato HiDrive hoch.
* **⚡ SSH Remote Dump**: Erstelle komprimierte MariaDB/MySQL `mysqldump` Backups direkt auf dem Webhosting per SSH und stream sie auf deinen HiDrive.
* **🤖 MCP Protocol Ready**: Integrierter Model Context Protocol Server (Stdio Transport) für LLM-Agenten.

---

## 🛠️ Installation & Setup

1. **Repository klonen / installieren**:
   ```bash
   git clone https://github.com/youruser/strato-companion.git
   cd strato-companion
   npm install
   ```

2. **Umgebungsvariablen konfigurierten**:
   Kopiere `.env.example` nach `.env` und trage deine Zugangsdaten ein:
   ```bash
   cp .env.example .env
   ```

3. **Projekt bauen**:
   ```bash
   npm run build
   ```

---

## 💻 Benutzung

### 1. CLI Modus

```bash
# Health & SSL Test ausführen
npx tsx src/index.ts health --url https://strato.de

# HiDrive Ordnerinhalt auflisten
npx tsx src/index.ts hidrive-ls --path /

# DB-Backup erstellen und auf HiDrive sichern
npx tsx src/index.ts backup-db --database meinedb
```

### 2. MCP Server Modus (für Antigravity / Claude Desktop)

Trage den Companion in deine MCP-Konfiguration (`mcp_config.json` oder `settings.json`) ein:

```json
{
  "mcpServers": {
    "strato-companion": {
      "command": "node",
      "args": ["/path/to/strato-companion/dist/index.js", "mcp"],
      "env": {
        "STRATO_HIDRIVE_WEBDAV_URL": "https://webdav.hidrive.strato.com",
        "STRATO_HIDRIVE_USERNAME": "dein_hidrive_user",
        "STRATO_HIDRIVE_PASSWORD": "dein_hidrive_passwort",
        "STRATO_WEBHOSTING_SSH_HOST": "ssh.strato.de",
        "STRATO_WEBHOSTING_SSH_USER": "dein_ssh_user"
      }
    }
  }
}
```

---

## 📄 Lizenz

MIT License
