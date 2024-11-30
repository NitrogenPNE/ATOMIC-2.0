/**
 * Compliance Checker Module for ATOMIC CorporateHQNode
 * Ensures compliance of transactions, blocks, and nodes with defined corporate rules.
 * Author: ATOMIC Development Team
 */

const fs = require('fs');
const path = require('path');

// Configuration
const complianceRulesPath = path.join(__dirname, 'complianceRules.json');
const validationLogsPath = path.join(__dirname, 'validationLogs.json');

// Logging Utility
function logCompliance(message, level = 'INFO') {
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

// Load Compliance Rules
function loadComplianceRules() {
    if (!fs.existsSync(complianceRulesPath)) {
        throw new Error(`Compliance rules not found at ${complianceRulesPath}`);
    }
    return JSON.parse(fs.readFileSync(complianceRulesPath, 'utf8'));
}

// Validate Transactions Against Compliance Rules
function validateTransactionCompliance(transaction) {
    logCompliance('Validating transaction compliance...');
    const rules = loadComplianceRules();

    if (!transaction || typeof transaction !== 'object') {
        throw new Error('Invalid transaction format.');
    }

    // Example rule: Check for required fields
    const requiredFields = rules.transaction.requiredFields || [];
    for (const field of requiredFields) {
        if (!(field in transaction)) {
            throw new Error(`Transaction is missing required field: ${field}`);
        }
    }

    // Example rule: Validate maximum transaction amount
    if (rules.transaction.maxAmount && transaction.amount > rules.transaction.maxAmount) {
        throw new Error(`Transaction exceeds maximum allowed amount: ${transaction.amount}`);
    }

    logCompliance('Transaction compliance validation passed.');
}

// Validate Block Compliance
function validateBlockCompliance(block) {
    logCompliance('Validating block compliance...');
    const rules = loadComplianceRules();

    if (!block || typeof block !== 'object') {
        throw new Error('Invalid block format.');
    }

    // Example rule: Check for block size limit
    if (rules.block.maxSize && JSON.stringify(block).length > rules.block.maxSize) {
        throw new Error('Block exceeds maximum allowed size.');
    }

    // Example rule: Check for minimum number of transactions
    if (rules.block.minTransactions && block.transactions.length < rules.block.minTransactions) {
        throw new Error('Block does not meet minimum transaction count.');
    }

    logCompliance('Block compliance validation passed.');
}

// Validate Node Compliance
function validateNodeCompliance(nodeConfig) {
    logCompliance('Validating node compliance...');
    const rules = loadComplianceRules();

    if (!nodeConfig || typeof nodeConfig !== 'object') {
        throw new Error('Invalid node configuration format.');
    }

    // Example rule: Check node region restriction
    if (rules.node.allowedRegions && !rules.node.allowedRegions.includes(nodeConfig.region)) {
        throw new Error(`Node region not allowed: ${nodeConfig.region}`);
    }

    // Example rule: Check for encryption level
    if (rules.node.minEncryptionLevel && nodeConfig.encryptionLevel < rules.node.minEncryptionLevel) {
        throw new Error('Node does not meet minimum encryption level.');
    }

    logCompliance('Node compliance validation passed.');
}

// Main Compliance Validation Function
function validateCompliance(entity, type) {
    logCompliance(`Starting compliance validation for ${type}...`);
    try {
        switch (type) {
            case 'transaction':
                validateTransactionCompliance(entity);
                break;
            case 'block':
                validateBlockCompliance(entity);
                break;
            case 'node':
                validateNodeCompliance(entity);
                break;
            default:
                throw new Error(`Unknown entity type: ${type}`);
        }
        logCompliance(`${type} compliance validation completed successfully.`);
        return true;
    } catch (error) {
        logCompliance(`${type} compliance validation failed: ${error.message}`, 'ERROR');
        return false;
    }
}

// Exported Functions
module.exports = {
    validateCompliance
};

// Example Usage
if (require.main === module) {
    const testTransaction = {
        id: 'tx-001',
        amount: 5000,
        sender: 'user1',
        receiver: 'user2'
    };

    const testBlock = {
        id: 'block-001',
        transactions: [testTransaction],
        size: 2048
    };

    const testNodeConfig = {
        id: 'node-001',
        region: 'North America',
        encryptionLevel: 3
    };

    try {
        console.log('Transaction compliance:', validateCompliance(testTransaction, 'transaction'));
        console.log('Block compliance:', validateCompliance(testBlock, 'block'));
        console.log('Node compliance:', validateCompliance(testNodeConfig, 'node'));
    } catch (error) {
        console.error('Error validating compliance:', error.message);
    }
}
