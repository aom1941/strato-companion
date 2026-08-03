import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { loadConfig } from '../config.js';
import { HiDriveAdapter } from '../core/hidrive.js';
import { WebhostingAdapter } from '../core/webhosting.js';
import { HealthMonitor } from '../core/health.js';
import { BackupOrchestrator } from '../core/backup.js';

export async function runMcpServer() {
  const config = loadConfig();
  const hidrive = new HiDriveAdapter(config.hidrive);
  const webhosting = new WebhostingAdapter(config.webhosting, config.db);
  const health = new HealthMonitor();
  const backup = new BackupOrchestrator(hidrive, webhosting);

  const server = new Server(
    {
      name: 'strato-companion-mcp',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'strato_hidrive_list',
          description: 'Listet Dateien und Ordner auf dem Strato HiDrive Cloud-Speicher via WebDAV auf.',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Remote-Pfad auf HiDrive (Standard: /)' },
            },
          },
        },
        {
          name: 'strato_hidrive_get_quota',
          description: 'Ruft die Quota und Speicherauslastung des HiDrive-Kontos ab.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'strato_webhosting_backup_db',
          description: 'Erstellt per SSH-mysqldump ein komprimiertes Datenbank-Backup und lädt es direkt auf HiDrive hoch.',
          inputSchema: {
            type: 'object',
            properties: {
              db_name: { type: 'string', description: 'Name der MariaDB/MySQL Datenbank' },
            },
          },
        },
        {
          name: 'strato_webhosting_exec_ssh',
          description: 'Führt einen unkritischen Shell-Befehl auf dem Strato Webhosting per SSH aus (z. B. php -v, ls, uptime).',
          inputSchema: {
            type: 'object',
            properties: {
              command: { type: 'string', description: 'Der auszuführende Shell-Befehl' },
            },
            required: ['command'],
          },
        },
        {
          name: 'strato_health_check',
          description: 'Prüft Erreichbarkeit, Antwortzeiten und SSL-Zertifikat einer Website/Domain.',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'URL der zu prüfenden Domain (z.B. https://example.com)' },
            },
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (name === 'strato_hidrive_list') {
        const pathStr = (args?.path as string) || '/';
        const files = await hidrive.listFiles(pathStr);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(files, null, 2),
            },
          ],
        };
      }

      if (name === 'strato_hidrive_get_quota') {
        const quota = await hidrive.getQuotaMock();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(quota, null, 2),
            },
          ],
        };
      }

      if (name === 'strato_webhosting_backup_db') {
        const dbName = args?.db_name as string;
        const result = await backup.runDatabaseBackup(dbName);
        return {
          content: [
            {
              type: 'text',
              text: `Datenbank-Backup erfolgreich auf HiDrive abgelegt:\n${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      }

      if (name === 'strato_webhosting_exec_ssh') {
        const cmd = args?.command as string;
        const output = await webhosting.executeCommand(cmd);
        return {
          content: [
            {
              type: 'text',
              text: output || '(Keine Ausgabe)',
            },
          ],
        };
      }

      if (name === 'strato_health_check') {
        const targetUrl = (args?.url as string) || config.targetDomain;
        const res = await health.checkUrl(targetUrl);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(res, null, 2),
            },
          ],
        };
      }

      throw new Error(`Unbekanntes Tool: ${name}`);
    } catch (err: any) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Fehler bei der Ausführung von ${name}: ${err.message}`,
          },
        ],
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
