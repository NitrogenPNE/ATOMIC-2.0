"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Compliance Manager
//
// Description:
// Ensures that all operations within the National Defense HQ Node comply with 
// relevant legal, regulatory, and organizational policies. Includes automated 
// checks for data handling, encryption, and transaction auditing.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - fs-extra: For file operations.
// - path: For resolving configuration file paths.
// - validationUtils: Reusable utilities for schema and policy validation.
// - activityAuditLogger: For logging compliance checks and results.
//
// Usage:
// const { performComplianceCheck } = require('./complianceManager');
// const isCompliant = await performComplianceCheck(transactionData, "transaction");
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const validationUtils = require("./validationUtils");
const { logInfo, logError } = require("../Monitoring/activityAuditLogger");

// Paths
const COMPLIANCE_RULES_PATH = path.resolve(__dirname, "../Config/complianceRules.json");
const COMPLIANCE_LOG_PATH = path.resolve(__dirname, "../Logs/Validation/complianceLogs.json");

/**
 * Performs compliance checks on data against predefined rules.
 * @param {Object} data - Data to validate (e.g., transaction, shard, or contract).
 * @param {string} type - Type of data being validated ("transaction", "shard", "contract").
 * @returns {Promise<boolean>} - True if compliant; otherwise false.
 */
async function performComplianceCheck(data, type) {
    logInfo(`Performing compliance check for type: ${type}`);

    try {
        // Step 1: Load compliance rules
        const complianceRules = await loadComplianceRules(type);
        if (!complianceRules) {
            throw new Error(`No compliance rules found for type: ${type}`);
        }

        // Step 2: Validate schema
        validationUtils.validateSchema(data, complianceRules.schema);
        logInfo(`Schema validation passed for type: ${type}`);

        // Step 3: Enforce additional rules
        enforceRules(data, complianceRules.rules);
        logInfo(`Rule enforcement passed for type: ${type}`);

        // Step 4: Log compliance result
        await logComplianceResult(type, data, true, "Compliance checks passed.");
        return true;
    } catch (error) {
        logError(`Compliance check failed for type: ${type}`, { error: error.message });
        await logComplianceResult(type, data, false, error.message);
        return false;
    }
}

/**
 * Loads compliance rules from the configuration file.
 * @param {string} type - The type of data being validated.
 * @returns {Promise<Object>} - The compliance rules for the specified type.
 */
async function loadComplianceRules(type) {
    try {
        const allRules = await fs.readJson(COMPLIANCE_RULES_PATH);
        return allRules[type] || null;
    } catch (error) {
        logError("Failed to load compliance rules.", { error: error.message });
        throw error;
    }
}

/**
 * Enforces additional compliance rules.
 * @param {Object} data - Data to validate.
 * @param {Array<Object>} rules - Array of rules to enforce.
 * @throws {Error} - If any rule is violated.
 */
function enforceRules(data, rules) {
    for (const rule of rules) {
        if (!rule.condition(data)) {
            throw new Error(`Rule violation: ${rule.message}`);
        }
    }
}

/**
 * Logs the result of a compliance check.
 * @param {string} type - Type of data validated.
 * @param {Object} data - Data validated.
 * @param {boolean} result - Whether the data passed compliance checks.
 * @param {string} message - Message detailing the result.
 * @returns {Promise<void>}
 */
async function logComplianceResult(type, data, result, message) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        type,
        dataId: data.id || "N/A",
        result,
        message,
    };

    try {
        const existingLogs = (await fs.readJson(COMPLIANCE_LOG_PATH, { throws: false })) || [];
        existingLogs.push(logEntry);
        await fs.writeJson(COMPLIANCE_LOG_PATH, existingLogs, { spaces: 2 });
        logInfo(`Compliance result logged for type: ${type}`);
    } catch (error) {
        logError("Failed to log compliance result.", { error: error.message });
    }
}

module.exports = {
    performComplianceCheck,
};

// ------------------------------------------------------------------------------
// End of Module: Compliance Manager
// Version: 1.0.0 | Updated: 2024-11-26
// ------------------------------------------------------------------------------