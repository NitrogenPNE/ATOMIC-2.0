/**
 * Transaction Validator for ATOMIC CorporateHQNode
 * Validates the integrity and compliance of transactions in the ATOMIC blockchain network.
 * Author: ATOMIC Development Team
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Configuration
const transactionValidationRulesPath = path.join(__dirname, 'transactionValidationRules.json');
const validationLogsPath = path.join(__dirname, 'validationLogs.json');

// Utility Functions
function logTransactionValidation(message, level = 'INFO') {
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

// Load Transaction Validation Rules
function loadTransactionValidationRules() {
    if (!fs.existsSync(transactionValidationRulesPath)) {
        throw new Error(`Transaction validation rules not found at ${transactionValidationRulesPath}`);
    }
    return JSON.parse(fs.readFileSync(transactionValidationRulesPath, 'utf8'));
}

// Validate Transaction Integrity
function validateTransactionIntegrity(transaction) {
    logTransactionValidation('Validating transaction integrity...');
    const rules = loadTransactionValidationRules();

    if (!transaction || typeof transaction !== 'object') {
        throw new Error('Invalid transaction structure.');
    }

    // Example rule: Check required fields
    const requiredFields = rules.requiredFields || [];
    for (const field of requiredFields) {
        if (!(field in transaction)) {
            throw new Error(`Transaction is missing required field: ${field}`);
        }
    }

    // Example rule: Verify transaction hash
    const computedHash = crypto
        .createHash(rules.hashAlgorithm || 'sha256')
        .update(JSON.stringify(transaction.data))
        .digest('hex');
    if (transaction.hash !== computedHash) {
        throw new Error('Transaction hash does not match computed hash.');
    }

    logTransactionValidation('Transaction integrity validation passed.');
    return true;
}

// Validate Transaction Compliance
function validateTransactionCompliance(transaction) {
    logTransactionValidation('Validating transaction compliance...');
    const rules = loadTransactionValidationRules();

    // Example rule: Validate transaction amount
    if (transaction.amount > rules.maxAmount) {
        throw new Error(`Transaction amount ${transaction.amount} exceeds the maximum allowed amount of ${rules.maxAmount}.`);
    }

    // Example rule: Check transaction frequency
    if (transaction.frequency < rules.minFrequency || transaction.frequency > rules.maxFrequency) {
        throw new Error(`Transaction frequency ${transaction.frequency} is outside the allowed range.`);
    }

    logTransactionValidation('Transaction compliance validation passed.');
    return true;
}

// Exported Functions
module.exports = {
    validateTransactionIntegrity,
    validateTransactionCompliance
};

// Example Usage
if (require.main === module) {
    const testTransaction = {
        id: 'txn-001',
        data: { sender: 'user1', receiver: 'user2', amount: 100 },
        hash: '9c8d8e5b1f19dcf07e8b9a473edc3a02c1a0656c4ecff5c48bc77a9b5cd81834',
        amount: 100,
        frequency: 300
    };

    try {
        console.log(
            'Transaction Integrity Validation:',
            validateTransactionIntegrity(testTransaction)
        );
        console.log(
            'Transaction Compliance Validation:',
            validateTransactionCompliance(testTransaction)
        );
    } catch (error) {
        console.error('Error during transaction validation:', error.message);
    }
}
