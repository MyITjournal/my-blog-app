import { Injectable } from '@nestjs/common';

type Entry = {
  value: string;
  expiresAt: number | null;
};

@Injectable()
export class RedisService {
  private readonly store = new Map<string, Entry>();

  private isExpired(entry: Entry): boolean {
    return entry.expiresAt !== null && Date.now() > entry.expiresAt;
  }

  private cleanupIfExpired(key: string): void {
    const entry = this.store.get(key);
    if (!entry) return;

    if (this.isExpired(entry)) {
      this.store.delete(key);
    }
  }

  async get(key: string): Promise<string | null> {
    this.cleanupIfExpired(key);
    return this.store.get(key)?.value ?? null;
  }

  async set(
    key: string,
    value: string,
    ttlSeconds: number,
    onlyIfNotExists = false,
  ): Promise<boolean> {
    this.cleanupIfExpired(key);

    if (onlyIfNotExists && this.store.has(key)) {
      return false;
    }

    const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
    return true;
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async increment(key: string, ttlSeconds: number): Promise<number> {
    this.cleanupIfExpired(key);

    const currentRaw = this.store.get(key)?.value;
    const current = currentRaw ? Number(currentRaw) : 0;
    const next = Number.isFinite(current) ? current + 1 : 1;

    const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value: String(next), expiresAt });

    return next;
  }
}
