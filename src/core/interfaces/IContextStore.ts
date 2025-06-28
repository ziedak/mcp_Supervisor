/**
 * Context data entry
 */
export interface ContextEntry {
  id: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  namespace: string;
  tags: string[];
  expiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Context query parameters
 */
export interface ContextQuery {
  namespace?: string;
  tags?: string[];
  keyPattern?: string;
  type?: string;
  limit?: number;
  offset?: number;
  includeExpired?: boolean;
}

/**
 * Context store statistics
 */
export interface ContextStoreStats {
  totalEntries: number;
  entriesByNamespace: Record<string, number>;
  entriesByType: Record<string, number>;
  expiredEntries: number;
  cacheHitRate: number;
  averageRetrievalTime: number;
}

/**
 * Interface for context storage operations
 */
export interface IContextStore {
  /**
   * Store a context entry
   */
  set(
    key: string,
    value: any,
    namespace?: string,
    tags?: string[],
    expiry?: Date
  ): Promise<void>;

  /**
   * Retrieve a context entry by key
   */
  get(key: string, namespace?: string): Promise<any | null>;

  /**
   * Check if a context entry exists
   */
  has(key: string, namespace?: string): Promise<boolean>;

  /**
   * Delete a context entry
   */
  delete(key: string, namespace?: string): Promise<boolean>;

  /**
   * Query context entries
   */
  query(query: ContextQuery): Promise<ContextEntry[]>;

  /**
   * Get all keys in a namespace
   */
  getKeys(namespace?: string): Promise<string[]>;

  /**
   * Get all namespaces
   */
  getNamespaces(): Promise<string[]>;

  /**
   * Clear expired entries
   */
  clearExpired(): Promise<number>;

  /**
   * Clear all entries in a namespace
   */
  clearNamespace(namespace: string): Promise<number>;

  /**
   * Clear all entries
   */
  clear(): Promise<void>;

  /**
   * Get store statistics
   */
  getStats(): Promise<ContextStoreStats>;

  /**
   * Export context data
   */
  export(namespace?: string): Promise<ContextEntry[]>;

  /**
   * Import context data
   */
  import(entries: ContextEntry[]): Promise<void>;
}
