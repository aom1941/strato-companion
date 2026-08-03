import { Client as SSHClient } from 'ssh2';
import fs from 'fs';
import { StratoConfig } from '../config.js';

export class WebhostingAdapter {
  constructor(
    private sshConfig: StratoConfig['webhosting'],
    private dbConfig: StratoConfig['db']
  ) {}

  public isConfigured(): boolean {
    return !!(this.sshConfig.sshHost && this.sshConfig.sshUser);
  }

  public async executeCommand(command: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Strato Webhosting SSH Client ist nicht vollständig konfiguriert.');
    }

    return new Promise((resolve, reject) => {
      const conn = new SSHClient();

      const connectConfig: any = {
        host: this.sshConfig.sshHost,
        port: this.sshConfig.sshPort,
        username: this.sshConfig.sshUser,
      };

      if (this.sshConfig.sshKeyPath && fs.existsSync(this.sshConfig.sshKeyPath)) {
        connectConfig.privateKey = fs.readFileSync(this.sshConfig.sshKeyPath);
      }

      conn.on('ready', () => {
        conn.exec(command, (err, stream) => {
          if (err) {
            conn.end();
            return reject(err);
          }

          let stdout = '';
          let stderr = '';

          stream
            .on('close', (code: number) => {
              conn.end();
              if (code !== 0 && stderr) {
                return reject(new Error(`Command exited with code ${code}: ${stderr}`));
              }
              resolve(stdout);
            })
            .on('data', (data: Buffer) => {
              stdout += data.toString();
            })
            .stderr.on('data', (data: Buffer) => {
              stderr += data.toString();
            });
        });
      }).on('error', (err) => {
        reject(err);
      }).connect(connectConfig);
    });
  }

  public async generateDatabaseDump(dbName?: string): Promise<string> {
    const targetDb = dbName || this.dbConfig.name;
    const user = this.dbConfig.user;
    const pass = this.dbConfig.password;
    const host = this.dbConfig.host;

    if (!targetDb || !user || !pass) {
      throw new Error('Datenbank-Zugangsdaten (Host, User, Pass, Name) unvollständig.');
    }

    // mysqldump command on Strato SSH shell
    const dumpCmd = `mysqldump -h ${host} -u ${user} -p'${pass}' ${targetDb} | gzip -9 | base64`;
    const base64Output = await this.executeCommand(dumpCmd);
    return base64Output.replace(/\s+/g, '');
  }
}
