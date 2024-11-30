/**
 * Block Validator Module for ATOMIC CorporateHQNode
 * Validates the structure, integrity, and consistency of blockchain blocks.
 * Author: ATOMIC Development Team
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const validationLogsPath = path.join(__dirname, 'validationLogs.json');
const blockSchemaPath = path.join(__dirname, 'blockSchema.json');

// Logging Utility
function logValidation(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message };
    console.log(`[${timestamp}] [${level}] ${message}`);
    appendLog(logEntry);
}

function appendLog(logEntry) {
    let logs = [];
    if (fs.existsSync(validationLogsPath)) {
        logs = JSON.parse(fs.readFileSync(validationLogsPath, 'utf8'));
    }
    logs.push(logEntry);
    fs.writeFileSync(validationLogsPath, JSON.stringify(logs, null, 4), 'utf8');
}

// Load Block Schema
function loadBlockSchema() {
    if (!fs.existsSync(blockSchemaPath)) {
        throw new Error(`Block schema not found at ${blockSchemaPath}`);
    }
    return JSON.parse(fs.readFileSync(blockSchemaPath, 'utf8'));
}

// Validate Block Structure
function validateStructure(block, schema) {
    logValidation('Validating block structure...');
    for (const field of Object.keys(schema)) {
        if (!(field in block)) {
            throw new Error(`Missing required field: ${field}`);
        }
        if (typeof block[field] !== schema[field]) {
            throw new Error(`Field type mismatch for ${field}: Expected ${schema[field]}, got ${typeof block[field]}`);
        }
    }
    logValidation('Block structure validation passed.');
}

// Validate Block Hash
function validateHash(block) {
    logValidation('Validating block hash...');
    const blockContent = { ...block };
    delete blockContent.hash;
    const calculatedHash = crypto.createHash('sha256').update(JSON.stringify(blockContent)).digest('hex');
    if (calculatedHash !== block.hash) {
        throw new Error('Block hash does not match the calculated hash.');
    }
    logValidation('Block hash validation passed.');
}

// Validate Block Transactions
function validateTransactions(block) {
    logValidation('Validating block transactions...');
    if (!Array.isArray(block.transactions)) {
        throw new Error('Block transactions must be an array.');
    }
    block.transactions.forEach((transaction, index) => {
        if (typeof transaction !== 'string' || transaction.length === 0) {
            throw new Error(`Invalid transaction at index ${index}`);
        }
    });
    logValidation('Block transactions validation passed.');
}

// Main Validation Function
function validateBlock(block) {
    logValidation('Starting block validation...');
    try {
        const schema = loadBlockSchema();
        validateStructure(block, schema);
        validateHash(block);
        validateTransactions(block);
        logValidation('Block validation completed successfully.');
        return true;
    } catch (error) {
        logValidation(`Block validation failed: ${error.message}`, 'ERROR');
        return false;
    }
}

// Exported Function
module.exports = {
    validateBlock
};

// Example Usage
if (require.main === module) {
    const testBlock = {
        id: 'block-123',
        timestamp: '2024-11-26T12:00:00Z',
        previousHash: 'abcdef1234567890',
        transactions: ['tx-1', 'tx-2', 'tx-3'],
        hash: 'generated_hash_here'
    };

    try {
        const result = validateBlock(testBlock);
        console.log('Block validation result:', result ? 'PASSED' : 'FAILED');
    } catch (error) {
        console.error('Error validating block:', error.message);
    }
}
