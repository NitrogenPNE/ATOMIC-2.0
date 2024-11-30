/**
 * Corporate Transaction Validator for ATOMIC CorporateHQNode
 * Validates corporate-level transactions to ensure compliance with business rules.
 * Author: ATOMIC Development Team
 */

const fs = require('fs');
const path = require('path');

// Configuration
const corporateValidationRulesPath = path.join(__dirname, 'corporateValidationRules.json');
const validationLogsPath = path.join(__dirname, 'validationLogs.json');

// Logging Utility
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

// Load Corporate Validation Rules
function loadCorporateValidationRules() {
    if (!fs.existsSync(corporateValidationRulesPath)) {
        throw new Error(`Corporate validation rules not found at ${corporateValidationRulesPath}`);
    }
    return JSON.parse(fs.readFileSync(corporateValidationRulesPath, 'utf8'));
}

// Validate Corporate Transaction
function validateCorporateTransaction(transaction) {
    logTransactionValidation('Validating corporate transaction...');
    const rules = loadCorporateValidationRules();

    if (!transaction || typeof transaction !== 'object') {
        throw new Error('Invalid transaction format.');
    }

    // Example rule: Check for required fields
    const requiredFields = rules.requiredFields || [];
    for (const field of requiredFields) {
        if (!(field in transaction)) {
            throw new Error(`Transaction is missing required field: ${field}`);
        }
    }

    // Example rule: Validate transaction purpose
    if (rules.allowedPurposes && !rules.allowedPurposes.includes(transaction.purpose)) {
        throw new Error(`Transaction purpose not allowed: ${transaction.purpose}`);
    }

    // Example rule: Validate transaction amount range
    if (transaction.amount < rules.minAmount || transaction.amount > rules.maxAmount) {
        throw new Error(`Transaction amount ${transaction.amount} is outside the allowed range.`);
    }

    logTransactionValidation('Corporate transaction validation passed.');
    return true;
}

// Exported Functions
module.exports = {
    validateCorporateTransaction
};

// Example Usage
if (require.main === module) {
    const testTransaction = {
        id: 'tx-corp-001',
        sender: 'CorporateDept1',
        receiver: 'CorporateDept2',
        amount: 10000,
        purpose: 'R&D Funding'
    };

    try {
        console.log(
            'Corporate Transaction Validation:',
            validateCorporateTransaction(testTransaction)
        );
    } catch (error) {
        console.error('Error during corporate transaction validation:', error.message);
    }
}
