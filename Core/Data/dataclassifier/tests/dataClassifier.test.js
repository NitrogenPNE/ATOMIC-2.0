const fs = require('fs');
const path = require('path');
const { classifyData } = require('../script/dataClassifier'); // Adjust path as needed

// Paths for test files
const validFilePath = path.join(__dirname, 'testFile.txt');
const invalidFilePath = path.join(__dirname, 'nonexistent.txt');

// Create a mock file before running tests
beforeAll(() => {
    fs.writeFileSync(validFilePath, 'Sample text for testing.'); // Create the test file
});

// Clean up after tests
afterAll(() => {
    if (fs.existsSync(validFilePath)) fs.unlinkSync(validFilePath); // Remove the test file
});

// Helper to escape special regex characters in file paths
const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Normalize paths for consistent matching
const normalizedInvalidPath = path.normalize(invalidFilePath);
const escapedPathRegex = new RegExp(`File not found: ${escapeRegExp(normalizedInvalidPath)}`);

describe('Data Classifier Function Tests', () => {
    it('should classify a string input correctly', async () => {
        const result = await classifyData('Test string');
        console.log('String Classification:', result);

        expect(result.bitAtoms.length).toBe(88); // 11 chars * 8 bits per char
        expect(result.byteAtoms.length).toBe(11); // 11 bytes
        expect(result.kbAtoms.length).toBe(0); // Less than 1 KB
    });

    it('should classify a JSON object correctly', async () => {
        const input = { key: 'value', count: 42 };
        const result = await classifyData(input);
        console.log('JSON Classification:', result);

        const jsonSize = Buffer.byteLength(JSON.stringify(input)) * 8; // Bits in JSON string
        expect(result.bitAtoms.length).toBe(jsonSize);
        expect(result.byteAtoms.length).toBeGreaterThan(0); // Serialized JSON as bytes
        expect(result.kbAtoms.length).toBe(0); // Should not reach KB size
    });

    it('should classify a buffer input correctly', async () => {
        const buffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
        const result = await classifyData(buffer);
        console.log('Buffer Classification:', result);

        expect(result.bitAtoms.length).toBe(32); // 4 bytes * 8 bits per byte
        expect(result.byteAtoms.length).toBe(4);
        expect(result.kbAtoms.length).toBe(0); // Less than 1 KB
    });

    it('should classify a valid text file correctly', async () => {
        const result = await classifyData(validFilePath);
        console.log('File Classification:', result);

        const fileSize = fs.statSync(validFilePath).size; // File size in bytes
        expect(result.byteAtoms.length).toBe(fileSize); // 1 byte per character
        expect(result.bitAtoms.length).toBe(fileSize * 8); // 8 bits per byte
    });

    it('should return an error for an invalid file path', async () => {
        await expect(classifyData(invalidFilePath)).rejects.toThrow(escapedPathRegex);
    });

    it('should classify an array input correctly', async () => {
        const input = [1, 2, 3, 4];
        const result = await classifyData(input);
        console.log('Array Classification:', result);

        const arraySize = Buffer.byteLength(JSON.stringify(input)) * 8; // Bits in serialized array
        expect(result.bitAtoms.length).toBe(arraySize); // Ensure bit atoms are accurate
    });

    it('should aggregate atoms correctly to higher sizes', async () => {
        const largeInput = Buffer.alloc(1024);  // 1 KB buffer
        const result = await classifyData(largeInput);
        console.log('KB Atoms:', result.kbAtoms);  // Confirm aggregation

        expect(result.kbAtoms.length).toBe(1);  // 1 KB atom should be created
        expect(result.byteAtoms.length).toBe(1024);  // 1024 bytes
    });
});