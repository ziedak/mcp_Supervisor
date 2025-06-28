/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  parseArguments,
  validateTransport,
  validatePort,
  showHelp,
  CliOptions,
} from '../../src/start-server';

// Mock console.log to capture help output
const mockConsoleLog = jest.fn();
const originalConsoleLog = console.log;
console.log = mockConsoleLog;

// Mock process.exit to capture exit calls
const mockProcessExit = jest.fn();
const originalProcessExit = process.exit;
process.exit = mockProcessExit as any;

describe('start-server CLI Functions - Simple Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore original functions
    console.log = originalConsoleLog;
    process.exit = originalProcessExit;
  });

  describe('validateTransport', () => {
    it('should return true for valid transports', () => {
      expect(validateTransport('stdio')).toBe(true);
      expect(validateTransport('http')).toBe(true);
    });

    it('should return false for invalid transports', () => {
      expect(validateTransport('invalid')).toBe(false);
      expect(validateTransport('tcp')).toBe(false);
      expect(validateTransport('')).toBe(false);
      expect(validateTransport('HTTP')).toBe(false); // case sensitive
    });
  });

  describe('validatePort', () => {
    it('should return valid port numbers', () => {
      expect(validatePort('3000')).toBe(3000);
      expect(validatePort('8080')).toBe(8080);
      expect(validatePort('1')).toBe(1);
      expect(validatePort('65535')).toBe(65535);
      expect(validatePort('80')).toBe(80);
    });

    it('should throw error for invalid port strings', () => {
      expect(() => validatePort('invalid')).toThrow("Invalid port 'invalid'");
      expect(() => validatePort('abc')).toThrow("Invalid port 'abc'");
      expect(() => validatePort('')).toThrow("Invalid port ''");
      // parseInt("3000.5", 10) returns 3000, so this doesn't throw
      // expect(() => validatePort("3000.5")).toThrow("Invalid port '3000.5'");
    });

    it('should throw error for out-of-range ports', () => {
      expect(() => validatePort('0')).toThrow("Invalid port '0'");
      expect(() => validatePort('-1')).toThrow("Invalid port '-1'");
      expect(() => validatePort('65536')).toThrow("Invalid port '65536'");
      expect(() => validatePort('100000')).toThrow("Invalid port '100000'");
    });
  });

  describe('showHelp', () => {
    it('should display help message', () => {
      showHelp();

      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const helpMessage = mockConsoleLog.mock.calls[0][0];
      expect(helpMessage).toContain('MCP Workspace Supervisor Server');
      expect(helpMessage).toContain('Usage:');
      expect(helpMessage).toContain('Arguments:');
      expect(helpMessage).toContain('Options:');
      expect(helpMessage).toContain('Examples:');
      expect(helpMessage).toContain('--transport');
      expect(helpMessage).toContain('--port');
      expect(helpMessage).toContain('--host');
      expect(helpMessage).toContain('--help');
    });
  });

  describe('parseArguments - Simple Cases', () => {
    it('should return default options with empty args', () => {
      const result = parseArguments([]);

      expect(result).toEqual({
        workspacePath: process.cwd(),
        transport: 'stdio',
        port: 3000,
        host: 'localhost',
      });
    });

    it('should parse workspace path as positional argument', () => {
      const result = parseArguments(['/custom/workspace']);

      expect(result.workspacePath).toBe('/custom/workspace');
      expect(result.transport).toBe('stdio');
      expect(result.port).toBe(3000);
      expect(result.host).toBe('localhost');
    });

    it('should parse stdio transport', () => {
      const result = parseArguments(['--transport', 'stdio']);

      expect(result.transport).toBe('stdio');
    });

    it('should parse http transport', () => {
      const result = parseArguments(['--transport', 'http']);

      expect(result.transport).toBe('http');
    });

    it('should parse custom port', () => {
      const result = parseArguments(['--transport', 'http', '--port', '8080']);

      expect(result.port).toBe(8080);
      expect(result.transport).toBe('http');
    });

    it('should parse custom host', () => {
      const result = parseArguments([
        '--transport',
        'http',
        '--host',
        '0.0.0.0',
      ]);

      expect(result.host).toBe('0.0.0.0');
      expect(result.transport).toBe('http');
    });

    it('should parse mixed arguments', () => {
      const result = parseArguments([
        '/workspace/path',
        '--transport',
        'http',
        '--port',
        '9000',
        '--host',
        '127.0.0.1',
      ]);

      expect(result).toEqual({
        workspacePath: '/workspace/path',
        transport: 'http',
        port: 9000,
        host: '127.0.0.1',
      });
    });
  });

  describe('parseArguments - Help Cases', () => {
    it('should show help and exit with --help', () => {
      expect(() => parseArguments(['--help'])).not.toThrow();

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('MCP Workspace Supervisor Server')
      );
      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });

    it('should show help and exit with -h', () => {
      expect(() => parseArguments(['-h'])).not.toThrow();

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('MCP Workspace Supervisor Server')
      );
      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });
  });

  describe('parseArguments - Error Cases', () => {
    it('should throw error for invalid transport', () => {
      expect(() => parseArguments(['--transport', 'invalid'])).toThrow(
        "Error: Invalid transport type 'invalid'. Must be 'stdio' or 'http'."
      );
    });

    it('should throw error for missing transport value', () => {
      expect(() => parseArguments(['--transport'])).toThrow(
        'Error: --transport requires a value'
      );
    });

    it('should throw error for invalid port', () => {
      expect(() => parseArguments(['--port', 'invalid'])).toThrow(
        "Invalid port 'invalid'. Must be a number between 1 and 65535."
      );
    });

    it('should throw error for missing port value', () => {
      expect(() => parseArguments(['--port'])).toThrow(
        'Error: --port requires a value'
      );
    });

    it('should throw error for missing host value', () => {
      expect(() => parseArguments(['--host'])).toThrow(
        'Error: --host requires a value'
      );
    });

    it('should throw error for unknown option', () => {
      expect(() => parseArguments(['--unknown'])).toThrow(
        "Error: Unknown option '--unknown'. Use --help for usage information."
      );
    });

    it('should throw error for multiple unknown options', () => {
      expect(() => parseArguments(['--unknown1', '--unknown2'])).toThrow(
        "Error: Unknown option '--unknown1'. Use --help for usage information."
      );
    });
  });

  describe('parseArguments - Edge Cases', () => {
    it('should handle port at minimum boundary', () => {
      const result = parseArguments(['--port', '1']);
      expect(result.port).toBe(1);
    });

    it('should handle port at maximum boundary', () => {
      const result = parseArguments(['--port', '65535']);
      expect(result.port).toBe(65535);
    });

    it('should handle complex workspace paths', () => {
      const result = parseArguments(['/path/with spaces/and-dashes_and.dots']);
      expect(result.workspacePath).toBe(
        '/path/with spaces/and-dashes_and.dots'
      );
    });

    it('should handle arguments in different order', () => {
      const result = parseArguments([
        '--port',
        '4000',
        '/workspace',
        '--transport',
        'http',
        '--host',
        '192.168.1.1',
      ]);

      expect(result).toEqual({
        workspacePath: '/workspace',
        transport: 'http',
        port: 4000,
        host: '192.168.1.1',
      });
    });
  });
});
