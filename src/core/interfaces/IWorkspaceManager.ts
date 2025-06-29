import { IContextStore } from './IContextStore';
import { IConfigurationManager } from '../services/ConfigurationManager';

export interface IWorkspaceManager {
  getActiveWorkspacePath(): string;
  switchWorkspace(path: string): Promise<void>;
  getContextStore(): IContextStore;
  getConfigManager(): IConfigurationManager;
  flush(): Promise<void>;
}
