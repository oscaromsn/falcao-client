import type { Geolocation } from "@schemas/common";

const JURIS_TOKEN_SALT = "T9!juris#F4LKN";
const SESSION_ID_KEY = "falcao_session_id";
const GEOLOCATION_KEY = "falcao_geolocation";
const GEOLOCATION_CACHE_TIME = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface SessionConfig {
  persistSession?: boolean;
  storageType?: "localStorage" | "sessionStorage" | "memory";
}

// Simple in-memory storage for Node.js environments
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

export class SessionManager {
  private sessionId: string;
  private geolocation: Geolocation | null = null;
  private storage: Storage;

  constructor(private config: SessionConfig = {}) {
    this.storage = this.createStorage();

    this.sessionId = this.loadOrCreateSessionId();
    this.loadCachedGeolocation();
  }

  private createStorage(): Storage {
    // Check if we're in a browser environment
    if (typeof globalThis !== "undefined" && globalThis.localStorage) {
      if (
        this.config.storageType === "sessionStorage" &&
        globalThis.sessionStorage
      ) {
        return globalThis.sessionStorage;
      }
      return globalThis.localStorage;
    }

    // Fall back to memory storage for Node.js
    return new MemoryStorage();
  }

  private loadOrCreateSessionId(): string {
    if (this.config.persistSession !== false) {
      const stored = this.storage.getItem(SESSION_ID_KEY);
      if (stored) return stored;
    }

    const newId = this.generateSessionId();
    if (this.config.persistSession !== false) {
      this.storage.setItem(SESSION_ID_KEY, newId);
    }
    return newId;
  }

  private generateSessionId(): string {
    return "_" + Math.random().toString(36).substring(2, 11);
  }

  private loadCachedGeolocation(): void {
    const cached = this.storage.getItem(GEOLOCATION_KEY);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        const age = Date.now() - (data.timestamp || 0);
        if (age < GEOLOCATION_CACHE_TIME) {
          this.geolocation = data.location;
        }
      } catch (_e) {
        // Invalid cache, ignore
      }
    }
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public generateJurisToken(): string {
    // Use platform-agnostic crypto implementation
    if (typeof Bun !== "undefined" && Bun.CryptoHasher) {
      // Bun environment
      const hasher = new Bun.CryptoHasher("md5");
      hasher.update(this.sessionId + JURIS_TOKEN_SALT);
      const hash = hasher.digest("hex");
      return hash.substring(3, 17);
    } else {
      // Node.js or browser environment
      const crypto = require("crypto");
      const hash = crypto
        .createHash("md5")
        .update(this.sessionId + JURIS_TOKEN_SALT)
        .digest("hex");
      return hash.substring(3, 17);
    }
  }

  public setGeolocation(location: Geolocation): void {
    this.geolocation = location;
    if (this.config.persistSession !== false) {
      this.storage.setItem(
        GEOLOCATION_KEY,
        JSON.stringify({
          location,
          timestamp: Date.now(),
        })
      );
    }
  }

  public getGeolocation(): Geolocation | null {
    return this.geolocation;
  }

  public getCommonParams(): Record<string, any> {
    const params: Record<string, any> = {
      sessionId: this.sessionId,
      juristkn: this.generateJurisToken(),
    };

    if (this.geolocation) {
      params.latitude = this.geolocation.latitude;
      params.longitude = this.geolocation.longitude;
      if (this.geolocation.cidade) params.cidade = this.geolocation.cidade;
      if (this.geolocation.estado) params.estado = this.geolocation.estado;
      if (this.geolocation.pais) params.pais = this.geolocation.pais;
    }

    return params;
  }

  public clearSession(): void {
    this.sessionId = this.generateSessionId();
    this.geolocation = null;
    if (this.config.persistSession !== false) {
      this.storage.removeItem(SESSION_ID_KEY);
      this.storage.removeItem(GEOLOCATION_KEY);
    }
  }
}
