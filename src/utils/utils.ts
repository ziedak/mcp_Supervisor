export function buildKey(key: string, namespace: string): string {
  return `${namespace}:${key}`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function inferType(
  value: any
): 'string' | 'number' | 'boolean' | 'object' | 'array' {
  if (Array.isArray(value)) return 'array';
  if (value === null || value === undefined) return 'object';
  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return type;
  }
  return 'object';
}

export function getWorkTime(startTime: number): number {
  return Date.now() - startTime;
}
