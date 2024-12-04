"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Compliance Validator
 *
 * Description:
 * Validates transactions for compliance with AML/KYC policies and other regulatory
 * requirements. Provides tools for logging and real-time monitoring.
 *
 * Dependencies:
 * - fs-extra: For secure file operations.
 * - path: For managing file paths.
 * - winston: For logging compliance-related activities.
 *
 * Author: GOVMintHQNode Integration Team
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const winston = require("winston");

// **Paths for Compliance Data**
const COMPLIANCE_LOGS_PATH = path.resolve(__dirname, "../Logs/complianceLogs.json");
const BLACKLIST_PATH = path.resolve(__dirname, "../Data/blacklistedEntities.json");

// **Logger Setup**
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: "compliance-error.log", level: "error" }),
        new winston.transports.File({ filename: "compliance.log" }),
    ],
});

/**
 * Validates a transaction for compliance.
 * @param {Object} transaction - The transaction object.
 * @returns {Object} - Validation result with `valid` and `error` fields.
 */
async function enforceCompliance(transaction) {
    try {
        logger.info(`Validating transaction for compliance: ${transaction.transactionId}`);

        // Step 1: Validate against blacklist
        const blacklist = await loadBlacklist();
        if (blacklist.includes(transaction.sender) || blacklist.includes(transaction.receiver)) {
            const error = "Transaction involves blacklisted entity.";
            logger.warn(`Compliance validation failed: ${error}`, { transaction });
            return { valid: false, error };
        }

        // Step 2: Check AML thresholds
        const amlThreshold = getAMLThreshold(transaction.currency);
        if (transaction.amount > amlThreshold) {
            const error = `Transaction exceeds AML threshold of ${amlThreshold} ${transaction.currency}.`;
            logger.warn(`Compliance validation failed: ${error}`, { transaction });
            return { valid: false, error };
        }

        // Step 3: Validate metadata
        if (!transaction.metadata || typeof transaction.metadata !== "object") {
            const error = "Transaction metadata is invalid or missing.";
            logger.warn(`Compliance validation failed: ${error}`, { transaction });
            return { valid: false, error };
        }

        logger.info(`Transaction passed compliance validation: ${transaction.transactionId}`);
        return { valid: true };
    } catch (error) {
        logger.error("Error during compliance validation:", { transaction, error: error.message });
        return { valid: false, error: "Internal compliance validation error." };
    }
}

/**
 * Logs a transaction for auditing and monitoring purposes.
 * @param {Object} transaction - The transaction object to log.
 * @returns {Promise<void>}
 */
async function logTransaction(transaction) {
    try {
        const complianceLogs = await loadComplianceLogs();
        complianceLogs.push({
            transactionId: transaction.transactionId,
            sender: transaction.sender,
            receiver: transaction.receiver,
            amount: transaction.amount,
            currency: transaction.currency,
            metadata: transaction.metadata,
            timestamp: new Date().toISOString(),
        });

        await fs.writeJson(COMPLIANCE_LOGS_PATH, complianceLogs, { spaces: 2 });
        logger.info(`Transaction logged for auditing: ${transaction.transactionId}`);
    } catch (error) {
        logger.error("Error logging transaction:", { transaction, error: error.message });
        throw error;
    }
}

/**
 * Loads the list of blacklisted entities.
 * @returns {Promise<Array<string>>} - Array of blacklisted entities.
 */
async function loadBlacklist() {
    try {
        if (!(await fs.pathExists(BLACKLIST_PATH))) {
            await fs.writeJson(BLACKLIST_PATH, []);
        }
        return await fs.readJson(BLACKLIST_PATH);
    } catch (error) {
        logger.error("Error loading blacklist data:", { error: error.message });
        throw error;
    }
}

/**
 * Loads compliance logs from the storage.
 * @returns {Promise<Array<Object>>} - Array of logged transactions.
 */
async function loadComplianceLogs() {
    try {
        if (!(await fs.pathExists(COMPLIANCE_LOGS_PATH))) {
            await fs.writeJson(COMPLIANCE_LOGS_PATH, []);
        }
        return await fs.readJson(COMPLIANCE_LOGS_PATH);
    } catch (error) {
        logger.error("Error loading compliance logs:", { error: error.message });
        throw error;
    }
}

/**
 * Returns the AML threshold for a given currency.
 * @param {string} currency - The currency code (e.g., USD, EUR).
 * @returns {number} - AML threshold value.
 */
function getAMLThreshold(currency) {
    // Example AML thresholds by currency
    const amlThresholds = {
        USD: 10000,
        EUR: 9000,
        GBP: 8500,
    };

    return amlThresholds[currency] || 10000; // Default to 10,000 if currency is not listed
}

module.exports = {
    enforceCompliance,
    logTransaction,
};

