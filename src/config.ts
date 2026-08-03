import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export interface StratoConfig {
  hidrive: {
    webdavUrl: string;
    username?: string;
    password?: string;
    sshHost: string;
    sshPort: number;
    sshKeyPath?: string;
  };
  webhosting: {
    sshHost: string;
    sshPort: number;
    sshUser?: string;
    sshKeyPath?: string;
    webroot: string;
  };
  db: {
    host: string;
    user?: string;
    password?: string;
    name?: string;
  };
  targetDomain: string;
}

export function loadConfig(): StratoConfig {
  return {
    hidrive: {
      webdavUrl: process.env.STRATO_HIDRIVE_WEBDAV_URL || 'https://webdav.hidrive.strato.com',
      username: process.env.STRATO_HIDRIVE_USERNAME,
      password: process.env.STRATO_HIDRIVE_PASSWORD,
      sshHost: process.env.STRATO_HIDRIVE_SSH_HOST || 'sftp.hidrive.strato.com',
      sshPort: parseInt(process.env.STRATO_HIDRIVE_SSH_PORT || '22', 10),
      sshKeyPath: process.env.STRATO_HIDRIVE_SSH_KEY_PATH,
    },
    webhosting: {
      sshHost: process.env.STRATO_WEBHOSTING_SSH_HOST || 'ssh.strato.de',
      sshPort: parseInt(process.env.STRATO_WEBHOSTING_SSH_PORT || '22', 10),
      sshUser: process.env.STRATO_WEBHOSTING_SSH_USER,
      sshKeyPath: process.env.STRATO_WEBHOSTING_SSH_KEY_PATH,
      webroot: process.env.STRATO_WEBHOSTING_WEBROOT || '/home/strato/www/htdocs',
    },
    db: {
      host: process.env.STRATO_DB_HOST || 'rdbms.strato.de',
      user: process.env.STRATO_DB_USER,
      password: process.env.STRATO_DB_PASSWORD,
      name: process.env.STRATO_DB_NAME,
    },
    targetDomain: process.env.STRATO_TARGET_DOMAIN || 'https://example.com',
  };
}
