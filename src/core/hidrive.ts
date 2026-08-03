import { createClient, WebDAVClient, FileStat } from 'webdav';
import { StratoConfig } from '../config.js';

export class HiDriveAdapter {
  private client: WebDAVClient | null = null;

  constructor(private config: StratoConfig['hidrive']) {
    if (config.username && config.password) {
      this.client = createClient(config.webdavUrl, {
        username: config.username,
        password: config.password,
      });
    }
  }

  public isConfigured(): boolean {
    return this.client !== null;
  }

  public async listFiles(remotePath: string = '/'): Promise<FileStat[]> {
    if (!this.client) {
      throw new Error('HiDrive WebDAV Client ist nicht konfiguriert (STRATO_HIDRIVE_USERNAME & STRATO_HIDRIVE_PASSWORD fehlen).');
    }
    const contents = await this.client.getDirectoryContents(remotePath);
    return Array.isArray(contents) ? contents : [contents];
  }

  public async uploadBuffer(remotePath: string, buffer: Buffer): Promise<boolean> {
    if (!this.client) {
      throw new Error('HiDrive WebDAV Client ist nicht konfiguriert.');
    }
    await this.client.putFileContents(remotePath, buffer, { overwrite: true });
    return true;
  }

  public async createDirectory(remotePath: string): Promise<boolean> {
    if (!this.client) {
      throw new Error('HiDrive WebDAV Client ist nicht konfiguriert.');
    }
    if (!(await this.client.exists(remotePath))) {
      await this.client.createDirectory(remotePath);
    }
    return true;
  }

  public async getQuotaMock(): Promise<{ usedBytes: number; totalBytes: number; percentageUsed: number }> {
    // Falls HiDrive REST API oder Quota-Extension verfügbar
    return {
      usedBytes: 15420000000,
      totalBytes: 100000000000,
      percentageUsed: 15.42,
    };
  }
}
