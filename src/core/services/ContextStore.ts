import { inject, injectable } from 'inversify';
import {
  IContextStore,
  ContextEntry,
  ContextQuery,
  ContextStoreStats,
} from '../interfaces/IContextStore';
import type { IContextPersistence } from '../interfaces/IContextPersistence';
import { TYPES } from '../../config/types';
import {
  buildKey,
  generateId,
  getWorkTime,
  inferType,
} from '../../utils/utils';

/**
 * Implementation of the context store service
 */
@injectable()
export class ContextStore implements IContextStore {
  private store: Map<string, ContextEntry> = new Map();
  private stats = {
    totalRequests: 0,
    cacheHits: 0,
    totalRetrievalTime: 0,
  };

  constructor(
    @inject(TYPES.ContextPersistence)
    private readonly persistence: IContextPersistence
  ) {}

  async initialize(): Promise<void> {
    const entries = await this.persistence.load();
    for (const entry of entries) {
      const fullKey = buildKey(entry.key, entry.namespace);
      this.store.set(fullKey, { ...entry });
    }
  }

  /**
   * Store a context entry
   */
  async set(
    key: string,
    value: any,
    namespace = 'default',
    tags: string[] = [],
    expiry?: Date
  ): Promise<void> {
    const fullKey = buildKey(key, namespace);
    const entry: ContextEntry = {
      id: generateId(),
      key,
      value,
      type: inferType(value),
      namespace,
      tags: [...tags],
      expiry,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.store.set(fullKey, entry);
    await this.persistence.save(Array.from(this.store.values()));
  }

  /**
   * Retrieve a context entry by key
   */
  async get(key: string, namespace = 'default'): Promise<any | null> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    const fullKey = buildKey(key, namespace);
    const entry = this.store.get(fullKey);

    if (!entry) {
      this.stats.totalRetrievalTime += getWorkTime(startTime);
      return null;
    }

    // Check if expired
    if (entry.expiry && entry.expiry < new Date()) {
      this.store.delete(fullKey);
      this.stats.totalRetrievalTime += getWorkTime(startTime);
      return null;
    }

    this.stats.cacheHits++;
    this.stats.totalRetrievalTime += getWorkTime(startTime);
    return entry.value;
  }

  /**
   * Check if a context entry exists
   */
  async has(key: string, namespace = 'default'): Promise<boolean> {
    const fullKey = buildKey(key, namespace);
    const entry = this.store.get(fullKey);

    if (!entry) return false;

    // Check if expired
    if (entry.expiry && entry.expiry < new Date()) {
      this.store.delete(fullKey);
      return false;
    }

    return true;
  }

  /**
   * Delete a context entry
   */
  async delete(key: string, namespace = 'default'): Promise<boolean> {
    const fullKey = buildKey(key, namespace);
    const deleted = this.store.delete(fullKey);
    await this.persistence.save(Array.from(this.store.values()));
    return deleted;
  }

  /**
   * Query context entries
   */
  async query(query: ContextQuery): Promise<ContextEntry[]> {
    const results: ContextEntry[] = [];
    const now = new Date();

    for (const entry of this.store.values()) {
      // Skip expired entries unless specifically requested
      if (!query.includeExpired && entry.expiry && entry.expiry < now) {
        continue;
      }

      // Filter by namespace
      if (query.namespace && entry.namespace !== query.namespace) {
        continue;
      }

      // Filter by type
      if (query.type && entry.type !== query.type) {
        continue;
      }

      // Filter by tags
      if (query.tags && query.tags.length > 0) {
        const hasMatchingTag = query.tags.some(tag => entry.tags.includes(tag));
        if (!hasMatchingTag) continue;
      }

      // Filter by key pattern
      if (query.keyPattern) {
        const regex = new RegExp(query.keyPattern, 'i');
        if (!regex.test(entry.key)) continue;
      }

      results.push({ ...entry });
    }

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || results.length;

    return results.slice(offset, offset + limit);
  }

  /**
   * Get all keys in a namespace
   */
  async getKeys(namespace = 'default'): Promise<string[]> {
    const keys: string[] = [];
    const now = new Date();

    for (const entry of this.store.values()) {
      if (entry.namespace === namespace) {
        // Skip expired entries
        if (entry.expiry && entry.expiry < now) {
          continue;
        }
        keys.push(entry.key);
      }
    }

    return keys;
  }

  /**
   * Get all namespaces
   */
  async getNamespaces(): Promise<string[]> {
    const namespaces = new Set<string>();
    const now = new Date();

    for (const entry of this.store.values()) {
      // Skip expired entries
      if (entry.expiry && entry.expiry < now) {
        continue;
      }
      namespaces.add(entry.namespace);
    }

    return Array.from(namespaces);
  }

  /**
   * Clear expired entries
   */
  async clearExpired(): Promise<number> {
    const now = new Date();
    let clearedCount = 0;
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.store.entries()) {
      if (entry.expiry && entry.expiry < now) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.store.delete(key);
      clearedCount++;
    }

    return clearedCount;
  }

  /**
   * Clear all entries in a namespace
   */
  async clearNamespace(namespace: string): Promise<number> {
    let clearedCount = 0;
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.store.entries()) {
      if (entry.namespace === namespace) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.store.delete(key);
      clearedCount++;
    }

    return clearedCount;
  }

  /**
   * Clear all entries
   */
  async clear(): Promise<void> {
    this.store.clear();
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      totalRetrievalTime: 0,
    };
    await this.persistence.save([]);
  }

  /**
   * Get store statistics
   */
  async getStats(): Promise<ContextStoreStats> {
    const now = new Date();
    const entriesByNamespace: Record<string, number> = {};
    const entriesByType: Record<string, number> = {};
    let expiredEntries = 0;
    let totalEntries = 0;

    for (const entry of this.store.values()) {
      totalEntries++;

      // Count by namespace
      entriesByNamespace[entry.namespace] =
        (entriesByNamespace[entry.namespace] || 0) + 1;

      // Count by type
      entriesByType[entry.type] = (entriesByType[entry.type] || 0) + 1;

      // Count expired entries
      if (entry.expiry && entry.expiry < now) {
        expiredEntries++;
      }
    }

    const cacheHitRate =
      this.stats.totalRequests > 0
        ? this.stats.cacheHits / this.stats.totalRequests
        : 0;

    const averageRetrievalTime =
      this.stats.totalRequests > 0
        ? this.stats.totalRetrievalTime / this.stats.totalRequests
        : 0;

    return {
      totalEntries,
      entriesByNamespace,
      entriesByType,
      expiredEntries,
      cacheHitRate,
      averageRetrievalTime,
    };
  }

  /**
   * Export context data
   */
  async export(namespace?: string): Promise<ContextEntry[]> {
    const entries: ContextEntry[] = [];

    for (const entry of this.store.values()) {
      if (!namespace || entry.namespace === namespace) {
        entries.push({ ...entry });
      }
    }

    return entries;
  }

  /**
   * Import context data
   */
  async import(entries: ContextEntry[]): Promise<void> {
    for (const entry of entries) {
      const fullKey = buildKey(entry.key, entry.namespace);
      this.store.set(fullKey, { ...entry });
    }
    await this.persistence.save(Array.from(this.store.values()));
  }

  /**
   * Get all context entries (self-explanatory alias for query({}))
   */
  async queryAll(): Promise<ContextEntry[]> {
    return this.query({});
  }

  /**
   * Flush in-memory context store to disk
   */
  async flush(): Promise<void> {
    await this.persistence.save(Array.from(this.store.values()));
  }
}
