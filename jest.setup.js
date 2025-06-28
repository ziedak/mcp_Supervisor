// Global test setup
jest.mock("fs/promises", () => ({
	readFile: jest.fn(),
	writeFile: jest.fn(),
	mkdir: jest.fn(),
	readdir: jest.fn(),
	stat: jest.fn(),
	unlink: jest.fn(),
	access: jest.fn(),
}));

// Reset all mocks between tests
beforeEach(() => {
	jest.clearAllMocks();
});

// Global teardown to ensure cleanup
afterAll(async () => {
	// Force garbage collection if available
	if (global.gc) {
		global.gc();
	}

	// Add a small delay to allow async operations to complete
	await new Promise((resolve) => setTimeout(resolve, 100));
});
