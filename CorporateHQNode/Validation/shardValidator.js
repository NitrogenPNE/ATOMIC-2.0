/**
 * Shard Validator for ATOMIC CorporateHQNode
 * Validates the integrity and compliance of shards in the ATOMIC blockchain network.
 * Author: ATOMIC Development Team
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Configuration
const shardValidationRulesPath = path.join(__dirname, 'shardValidationRules.json');
const validationLogsPath = path.join(__dirname, 'validationLogs.json');

// Utility Functions
function logShardValidation(message, level = 'INFO') {
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

// Load Shard Validation Rules
function loadShardValidationRules() {
    if (!fs.existsSync(shardValidationRulesPath)) {
        throw new Error(`Shard validation rules not found at ${shardValidationRulesPath}`);
    }
    return JSON.parse(fs.readFileSync(shardValidationRulesPath, 'utf8'));
}

// Validate Shard Integrity
function validateShardIntegrity(shard) {
    logShardValidation('Validating shard integrity...');
    const rules = loadShardValidationRules();

    if (!shard || typeof shard !== 'object') {
        throw new Error('Invalid shard structure.');
    }

    // Example rule: Check required fields
    const requiredFields = rules.requiredFields || [];
    for (const field of requiredFields) {
        if (!(field in shard)) {
            throw new Error(`Shard is missing required field: ${field}`);
        }
    }

    // Example rule: Verify shard hash
    const computedHash = crypto
        .createHash(rules.hashAlgorithm || 'sha256')
        .update(JSON.stringify(shard.data))
        .digest('hex');
    if (shard.hash !== computedHash) {
        throw new Error('Shard hash does not match computed hash.');
    }

    logShardValidation('Shard integrity validation passed.');
    return true;
}

// Validate Shard Compliance
function validateShardCompliance(shard) {
    logShardValidation('Validating shard compliance...');
    const rules = loadShardValidationRules();

    // Example rule: Validate shard size
    if (shard.size > rules.maxSize) {
        throw new Error(`Shard size ${shard.size} exceeds the maximum allowed size of ${rules.maxSize}.`);
    }

    // Example rule: Check shard frequency
    if (shard.frequency < rules.minFrequency || shard.frequency > rules.maxFrequency) {
        throw new Error(`Shard frequency ${shard.frequency} is outside the allowed range.`);
    }

    logShardValidation('Shard compliance validation passed.');
    return true;
}

// Exported Functions
module.exports = {
    validateShardIntegrity,
    validateShardCompliance
};

// Example Usage
if (require.main === module) {
    const testShard = {
        id: 'shard-001',
        data: { transactions: [] },
        hash: 'd3c4e89b1bf5678e29885d44c1a9bdae53d4c8543e8d9c44b0338c8fd94f5a6e',
        size: 5000,
        frequency: 120
    };

    try {
        console.log(
            'Shard Integrity Validation:',
            validateShardIntegrity(testShard)
        );
        console.log(
            'Shard Compliance Validation:',
            validateShardCompliance(testShard)
        );
    } catch (error) {
        console.error('Error during shard validation:', error.message);
    }
}
