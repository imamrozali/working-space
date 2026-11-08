import fs from 'node:fs';
import path from 'node:path';

export interface PersistedSession {
  sessionId: string;
  pairToken: string;
  pairCode: string;
  desktopClientId: string;
  webClientId: string;
  pairedAt: number;
  expiresAt: number;
}

export class SessionStore {
  private filePath: string;
  private cache: Map<string, PersistedSession> = new Map();

  constructor(filePath?: string) {
    this.filePath = filePath || process.env.SESSION_STORE_PATH || path.resolve(process.cwd(), 'data', 'sessions.json');
    this.init();
  }

  private init(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {
        // Fall back to memory-only if filesystem directory cannot be created
      }
    }
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    if (!fs.existsSync(this.filePath)) {
      this.cache.clear();
      return;
    }

    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const data: PersistedSession[] = JSON.parse(raw);
      const now = Date.now();
      this.cache.clear();

      for (const item of data) {
        if (item.expiresAt > now) {
          this.cache.set(item.pairToken, item);
        }
      }
    } catch {
      this.cache.clear();
    }
  }

  private flushToDisk(): void {
    try {
      const items = Array.from(this.cache.values());
      const tempPath = `${this.filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(items, null, 2), 'utf8');
      fs.renameSync(tempPath, this.filePath);
    } catch {
      // In constrained environments where writes fail, memory cache remains available
    }
  }

  public save(session: PersistedSession): void {
    this.cache.set(session.pairToken, session);
    this.flushToDisk();
  }

  public get(pairToken: string): PersistedSession | undefined {
    const session = this.cache.get(pairToken);
    if (!session) return undefined;

    if (Date.now() > session.expiresAt) {
      this.delete(pairToken);
      return undefined;
    }
    return session;
  }

  public delete(pairToken: string): void {
    if (this.cache.delete(pairToken)) {
      this.flushToDisk();
    }
  }

  public getAll(): PersistedSession[] {
    const now = Date.now();
    const valid: PersistedSession[] = [];
    for (const [token, item] of this.cache.entries()) {
      if (item.expiresAt > now) {
        valid.push(item);
      } else {
        this.cache.delete(token);
      }
    }
    return valid;
  }

  public clear(): void {
    this.cache.clear();
    try {
      if (fs.existsSync(this.filePath)) {
        fs.unlinkSync(this.filePath);
      }
    } catch {
      // Ignore cleanup error
    }
  }
}

export const sessionStore = new SessionStore();

