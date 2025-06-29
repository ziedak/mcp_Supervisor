Plan: Single-Workspace, Per-Workspace Cache with Auto-Switching

1. Workspace Detection
   The MCP server is started with a workspace path (via CLI or config).
   If a new request comes in for a different workspace, the server detects the switch.
2. Per-Workspace In-Memory Cache
   Keep a single in-memory cache for the currently active workspace (context store, config, etc.).
   When a workspace switch is detected:
   Flush (persist) the current workspace’s state to disk.
   Clear the in-memory cache.
   Load the new workspace’s data from disk into memory.
3. Persistence
   On any mutating operation, persist changes to disk for the active workspace.
   On workspace switch or server shutdown, flush the in-memory state to disk.
4. Implementation Steps
   WorkspaceManager Service
   Tracks the current active workspace path.
   Handles loading, caching, and flushing logic.
   ContextStore/ConfigManager
   Use the WorkspaceManager to get/set the current workspace’s data.
   Workspace Switch Detection
   On each request (http), check if the workspace path differs from the cached one.
   If so, flush and load as described.
   Graceful Shutdown
   On shutdown, flush the current workspace’s state to disk.
   Time & Complexity Estimate
   WorkspaceManager: 20 min
   Refactor ContextStore/ConfigManager: 20 min
   Switch detection logic: 10 min
   Shutdown handling: 10 min
   Total: ~1 hour
   Next Step: WorkspaceManager Skeleton
   Would you like to proceed with the implementation of a WorkspaceManager service that encapsulates this logic and exposes methods for:

getActiveWorkspacePath()
switchWorkspace(path: string)
getContextStore()
getConfigManager()
flush()
