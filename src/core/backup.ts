import { HiDriveAdapter } from './hidrive.js';
import { WebhostingAdapter } from './webhosting.js';

export class BackupOrchestrator {
  constructor(
    private hidrive: HiDriveAdapter,
    private webhosting: WebhostingAdapter
  ) {}

  public async runDatabaseBackup(dbName?: string): Promise<{ success: boolean; remotePath: string; sizeBytes: number }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const base64Dump = await this.webhosting.generateDatabaseDump(dbName);
    const buffer = Buffer.from(base64Dump, 'base64');

    const remoteDir = '/backups/databases';
    const remotePath = `${remoteDir}/db_dump_${dbName || 'default'}_${timestamp}.sql.gz`;

    await this.hidrive.createDirectory(remoteDir);
    await this.hidrive.uploadBuffer(remotePath, buffer);

    return {
      success: true,
      remotePath,
      sizeBytes: buffer.length,
    };
  }
}
