const { classifierLogic } = require('../script/classifierLogic'); // Adjust the path if necessary
const fs = require('fs');
const path = require('path');

// Mock file paths
const validFilePath = path.join(__dirname, 'mockFile.txt');
const unknownFilePath = path.join(__dirname, 'mock.unknown');
const invalidFilePath = path.join(__dirname, 'nonexistent.txt');

// Create a mock text file before running tests
beforeAll(() => {
    fs.writeFileSync(validFilePath, 'Sample text data'); // Create the mock text file
});

// Cleanup mock files after tests
afterAll(() => {
    if (fs.existsSync(validFilePath)) fs.unlinkSync(validFilePath);
});

// Begin tests
describe('classifierLogic Function Tests', () => {
    it('should classify plain text data correctly', async () => {
        const result = await classifierLogic('Sample text data', null, 'user1');
        console.log('Text Data Classification:', result);
        expect(result.classificationResult.type).toBe('text');
        expect(result.classificationResult.sizeKB).toBeGreaterThan(0);
    });

    it('should classify JSON data correctly', async () => {
        const result = await classifierLogic({ name: 'Test', value: 42 }, null, 'user1');
        console.log('JSON Data Classification:', result);
        expect(result.classificationResult.type).toBe('structured');
        expect(result.classificationResult.sizeKB).toBeGreaterThan(0);
    });

    it('should classify binary data correctly', async () => {
        const buffer = Buffer.from([0x00, 0x01, 0x02]);
        const result = await classifierLogic(buffer, null, 'user1');
        console.log('Binary Data Classification:', result);
        expect(result.classificationResult.type).toBe('binary');
        expect(result.classificationResult.sizeKB).toBeGreaterThan(0);
    });

    it('should classify a valid text file correctly', async () => {
        const result = await classifierLogic(null, validFilePath, 'user1');
        console.log('File Classification:', result);
        expect(result.classificationResult.type).toBe('text');
        expect(result.classificationResult.sizeKB).toBeGreaterThan(0);
    });

    it('should return unknown for unsupported file types', async () => {
        fs.writeFileSync(unknownFilePath, 'Unknown content'); // Create mock file

        const result = await classifierLogic(null, unknownFilePath, 'user1');
        console.log('Unknown File Classification:', result);
        expect(result.classificationResult.type).toBe('unknown');

        fs.unlinkSync(unknownFilePath); // Clean up
    });

    it('should throw an error for invalid file paths', async () => {
        await expect(classifierLogic(null, invalidFilePath, 'user1')).rejects.toThrow(
            `Error accessing file at ${invalidFilePath}`
        );
    });

    it('should correctly classify large files based on config threshold', async () => {
        const largeFile = Buffer.alloc(1024 * 1024); // Create a 1 MB buffer
        const result = await classifierLogic(largeFile, null, 'user1');
        console.log('Large File Classification:', result);
        expect(result.classificationResult.isLarge).toBe(true);
    });
});