import { container } from '../../src/config/container';
import { TYPES } from '../../src/config/types';
import { IConfigurationManager } from '../../src/core/services/ConfigurationManager';
import { IContextPersistence } from '../../src/core/interfaces/IContextPersistence';
import { IContextStore } from '../../src/core/interfaces/IContextStore';
import { WorkspaceManager } from '../../src/core/services/WorkspaceManager';
import { IWorkspaceManager } from '../../src/core/interfaces/IWorkspaceManager';

describe('DI Container Happy Path', () => {
  it('should resolve ConfigurationManager as singleton', () => {
    const config1 = container.get<IConfigurationManager>(
      TYPES.ConfigurationManager
    );
    const config2 = container.get<IConfigurationManager>(
      TYPES.ConfigurationManager
    );
    expect(config1).toBe(config2);
  });

  it('should resolve FileContextPersistence as singleton', () => {
    const persistence1 = container.get<IContextPersistence>(
      TYPES.ContextPersistence
    );
    const persistence2 = container.get<IContextPersistence>(
      TYPES.ContextPersistence
    );
    expect(persistence1).toBe(persistence2);
  });

  it('should resolve ContextStore and expose context methods', () => {
    const store = container.get<IContextStore>(TYPES.ContextStore);
    expect(store).toBeDefined();
    expect(typeof store.set).toBe('function');
    expect(typeof store.get).toBe('function');
    expect(typeof store.clear).toBe('function');
    expect(typeof store.getStats).toBe('function');
  });

  it('should resolve WorkspaceManager as singleton', () => {
    const wm1 = container.get<IWorkspaceManager>(TYPES.WorkspaceManager);
    const wm2 = container.get<IWorkspaceManager>(TYPES.WorkspaceManager);
    expect(wm1).toBe(wm2);
    expect(wm1).toBeInstanceOf(WorkspaceManager);
  });
});
