import { StdioTransport } from './StdioTransport';
import { HttpTransport, HttpTransportConfig } from './HttpTransport';
import { ITransportAdapter } from '../../core/interfaces/ITransportAdapter';

export type TransportType = 'stdio' | 'http';

export interface TransportOptions {
  http?: HttpTransportConfig;
}

/**
 * Factory for creating transport adapters
 */
export class TransportFactory {
  /**
   * Create a transport adapter of the specified type
   * @param type - The type of transport to create
   * @param options - Configuration options for the transport
   * @returns Transport adapter instance
   */
  static create(
    type: TransportType,
    options?: TransportOptions
  ): ITransportAdapter {
    switch (type) {
      case 'stdio':
        return new StdioTransport();

      case 'http':
        if (!options?.http) {
          throw new Error('HTTP transport requires configuration options');
        }
        return new HttpTransport(options.http);

      default:
        throw new Error(`Unsupported transport type: ${type}`);
    }
  }

  /**
   * Get available transport types
   * @returns Array of supported transport types
   */
  static getSupportedTypes(): TransportType[] {
    return ['stdio', 'http'];
  }
}
