import { injectable, inject } from 'inversify';
import { IWorkspaceManager } from '../interfaces/IWorkspaceManager';
import { IContextStore } from '../interfaces/IContextStore';
import { IConfigurationManager } from './ConfigurationManager';
import { ContextStore } from './ContextStore';
import { FileContextPersistence } from './FileContextPersistence';
import { TYPES } from '../../config/types';
import type { ILogger } from '../interfaces/ILogger';
import type { ConfigurationManagerFactory } from './ConfigurationManager';

@injectable()
export class WorkspaceManager implements IWorkspaceManager {
  private activeWorkspacePath: string = '';
  private contextStore: IContextStore | null = null;
  private configManager: IConfigurationManager | null = null;

  constructor(
    @inject(TYPES.Logger) private readonly logger: ILogger,
    @inject(TYPES.ConfigurationManagerFactory)
    private readonly configManagerFactory: ConfigurationManagerFactory
  ) {}

  getActiveWorkspacePath(): string {
    return this.activeWorkspacePath;
  }

  async switchWorkspace(path: string): Promise<void> {
    if (this.activeWorkspacePath === path) return;
    await this.flush();
    this.activeWorkspacePath = path;
    // Load context store for new workspace
    const persistence = new FileContextPersistence(
      `${path}/.mcp/context-store.json`
    );
    this.contextStore = new ContextStore(persistence);
    await (this.contextStore as ContextStore).initialize?.();
    // Use factory to create config manager for new workspace
    this.configManager = this.configManagerFactory();
    await (this.configManager as IConfigurationManager).loadConfig(
      `${path}/.supervisorrc`
    );
  }

  getContextStore(): IContextStore {
    if (!this.contextStore) throw new Error('No workspace loaded');
    return this.contextStore;
  }

  getConfigManager(): IConfigurationManager {
    if (!this.configManager) throw new Error('No workspace loaded');
    return this.configManager;
  }

  async flush(): Promise<void> {
    if (
      this.contextStore &&
      typeof (this.contextStore as any).flush === 'function'
    ) {
      await (this.contextStore as any).flush();
    }
    if (
      this.configManager &&
      typeof (this.configManager as any).flush === 'function'
    ) {
      await (this.configManager as any).flush();
    }
  }
}
