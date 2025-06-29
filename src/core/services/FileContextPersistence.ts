import { ContextEntry } from '../interfaces/IContextStore';
import { IContextPersistence } from '../interfaces/IContextPersistence';
import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * File-based implementation of IContextPersistence
 */
export class FileContextPersistence implements IContextPersistence {
  private filePath: string;

  constructor(filePath = 'context-store.json') {
    this.filePath = join(process.cwd(), filePath);
  }

  async load(): Promise<ContextEntry[]> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(data) as ContextEntry[];
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw err;
    }
  }

  async save(entries: ContextEntry[]): Promise<void> {
    await fs.writeFile(
      this.filePath,
      JSON.stringify(entries, null, 2),
      'utf-8'
    );
  }
}
