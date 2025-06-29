import { ContextEntry } from '../interfaces/IContextStore';

/**
 * Interface for context persistence strategies
 */
export interface IContextPersistence {
  load(): Promise<ContextEntry[]>;
  save(entries: ContextEntry[]): Promise<void>;
}
