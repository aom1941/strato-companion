import { Command } from 'commander';
import { loadConfig } from '../config.js';
import { HealthMonitor } from '../core/health.js';
import { HiDriveAdapter } from '../core/hidrive.js';
import { WebhostingAdapter } from '../core/webhosting.js';
import { BackupOrchestrator } from '../core/backup.js';

export function runCli() {
  const program = new Command();
  const config = loadConfig();

  program
    .name('strato-companion')
    .description('CLI Companion für Strato HiDrive & Webhosting')
    .version('0.1.0');

  program
    .command('health')
    .description('Prüfe Status und SSL-Zertifikat der konfigurierten Ziel-Domain')
    .option('-u, --url <url>', 'Spezifische Ziel-URL zum Testen')
    .action(async (options) => {
      const targetUrl = options.url || config.targetDomain;
      console.log(`🔍 Prüfe Health & SSL für: ${targetUrl}...`);
      const monitor = new HealthMonitor();
      const res = await monitor.checkUrl(targetUrl);
      console.log(JSON.stringify(res, null, 2));
    });

  program
    .command('hidrive-ls')
    .description('Listet Ordnerinhalte auf HiDrive auf')
    .option('-p, --path <path>', 'HiDrive Pfad', '/')
    .action(async (options) => {
      console.log(`📁 Listiere HiDrive Pfad: ${options.path}...`);
      const hidrive = new HiDriveAdapter(config.hidrive);
      try {
        const files = await hidrive.listFiles(options.path);
        console.log(files);
      } catch (err: any) {
        console.error(`❌ Fehler: ${err.message}`);
      }
    });

  program
    .command('ssh-exec')
    .description('Führt einen SSH-Befehl auf dem Webhosting aus')
    .argument('<command>', 'Shell-Befehl')
    .action(async (commandStr) => {
      console.log(`⚡ Führe SSH-Befehl aus: "${commandStr}"...`);
      const webhosting = new WebhostingAdapter(config.webhosting, config.db);
      try {
        const output = await webhosting.executeCommand(commandStr);
        console.log(output);
      } catch (err: any) {
        console.error(`❌ SSH-Fehler: ${err.message}`);
      }
    });

  program
    .command('backup-db')
    .description('Erstellt ein Remote DB-Backup per mysqldump und sichert es auf HiDrive')
    .option('-d, --database <dbname>', 'Datenbank-Name')
    .action(async (options) => {
      console.log(`📦 Starte DB-Backup...`);
      const hidrive = new HiDriveAdapter(config.hidrive);
      const webhosting = new WebhostingAdapter(config.webhosting, config.db);
      const orchestrator = new BackupOrchestrator(hidrive, webhosting);
      try {
        const res = await orchestrator.runDatabaseBackup(options.database);
        console.log(`✅ Backup erfolgreich!`, res);
      } catch (err: any) {
        console.error(`❌ Backup-Fehler: ${err.message}`);
      }
    });

  program.parse(process.argv);
}
