import tls from 'tls';
import { URL } from 'url';

export interface HealthCheckResult {
  url: string;
  isOnline: boolean;
  statusCode?: number;
  responseTimeMs: number;
  ssl?: {
    valid: boolean;
    validTo?: string;
    daysRemaining?: number;
    issuer?: string;
  };
}

export class HealthMonitor {
  public async checkUrl(targetUrl: string): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      const response = await fetch(targetUrl, { method: 'HEAD', redirect: 'follow' });
      const responseTimeMs = Date.now() - startTime;

      let sslInfo;
      if (targetUrl.startsWith('https://')) {
        sslInfo = await this.checkSslCertificate(targetUrl);
      }

      return {
        url: targetUrl,
        isOnline: response.ok || response.status < 400,
        statusCode: response.status,
        responseTimeMs,
        ssl: sslInfo,
      };
    } catch (err: any) {
      return {
        url: targetUrl,
        isOnline: false,
        responseTimeMs: Date.now() - startTime,
      };
    }
  }

  private async checkSslCertificate(targetUrl: string): Promise<{ valid: boolean; validTo?: string; daysRemaining?: number; issuer?: string }> {
    return new Promise((resolve) => {
      try {
        const parsedUrl = new URL(targetUrl);
        const host = parsedUrl.hostname;
        const port = parsedUrl.port ? parseInt(parsedUrl.port, 10) : 443;

        const socket = tls.connect(port, host, { servername: host }, () => {
          const cert = socket.getPeerCertificate();
          socket.end();

          if (!cert || !cert.valid_to) {
            return resolve({ valid: false });
          }

          const validTo = new Date(cert.valid_to);
          const daysRemaining = Math.floor((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

          const rawIssuer = cert.issuer?.O || cert.issuer?.CN;
          const issuer = Array.isArray(rawIssuer) ? rawIssuer.join(', ') : rawIssuer;

          resolve({
            valid: socket.authorized,
            validTo: validTo.toISOString(),
            daysRemaining,
            issuer,
          });
        });

        socket.on('error', () => {
          resolve({ valid: false });
        });
      } catch {
        resolve({ valid: false });
      }
    });
  }
}
