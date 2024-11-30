"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Personnel Clearance Manager
//
// Description:
// Manages personnel clearance levels and enforces access restrictions based
// on clearance tiers (Tier 1 through Tier 5) for critical operations within 
// the National Defense HQ Node.
//
// Dependencies:
// - fs-extra: For file operations.
// - path: For clearance record file management.
// - activityAuditLogger: Logs personnel clearance changes and access attempts.
// - zeroTrustAccessControl: Validates access using Zero Trust policies.
//
// Usage:
// const { validateAccess, updateClearanceLevel } = require('./personnelClearanceManager');
// validateAccess(userId, "Tier 5").then(console.log).catch(console.error);
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const { logInfo, logError } = require("../Monitoring/activityAuditLogger");
const zeroTrust = require("../Security/zeroTrustAccessControl");

// Paths
const CLEARANCE_FILE = path.resolve(__dirname, "./Personnel/clearanceRecords.json");

// Tier-Based Clearance Levels
const CLEARANCE_TIERS = ["Tier 1", "Tier 2", "Tier 3", "Tier 4", "Tier 5"];

/**
 * Validates if a user has the required clearance tier for an operation.
 * @param {string} userId - ID of the user requesting access.
 * @param {string} requiredTier - Required clearance tier for the operation.
 * @returns {Promise<boolean>} - Whether access is granted.
 */
async function validateAccess(userId, requiredTier) {
    logInfo(`Validating access for user: ${userId} with required tier: ${requiredTier}`);

    try {
        const clearanceRecords = await loadClearanceRecords();

        const userClearance = clearanceRecords[userId];
        if (!userClearance) {
            throw new Error(`No clearance record found for user: ${userId}`);
        }

        // Compare clearance tiers based on their index
        if (CLEARANCE_TIERS.indexOf(userClearance.level) < CLEARANCE_TIERS.indexOf(requiredTier)) {
            logError(`Access denied for user: ${userId}. Insufficient clearance tier.`);
            return false;
        }

        // Integrate with Zero Trust policies
        const isZeroTrustVerified = await zeroTrust.validateUser(userId);
        if (!isZeroTrustVerified) {
            logError(`Zero Trust validation failed for user: ${userId}`);
            return false;
        }

        logInfo(`Access granted for user: ${userId}`);
        return true;
    } catch (error) {
        logError(`Error validating access for user: ${userId}: ${error.message}`);
        throw error;
    }
}

/**
 * Updates a user's clearance tier.
 * @param {string} userId - ID of the user.
 * @param {string} newTier - New clearance tier to assign.
 * @returns {Promise<void>}
 */
async function updateClearanceLevel(userId, newTier) {
    logInfo(`Updating clearance tier for user: ${userId} to ${newTier}`);

    try {
        if (!CLEARANCE_TIERS.includes(newTier)) {
            throw new Error(`Invalid clearance tier: ${newTier}`);
        }

        const clearanceRecords = await loadClearanceRecords();
        clearanceRecords[userId] = {
            level: newTier,
            updatedAt: new Date().toISOString(),
        };

        await saveClearanceRecords(clearanceRecords);
        logInfo(`Clearance tier updated successfully for user: ${userId}`);
    } catch (error) {
        logError(`Failed to update clearance tier for user: ${userId}: ${error.message}`);
        throw error;
    }
}

/**
 * Loads clearance records from the clearance file.
 * @returns {Promise<Object>} - Parsed clearance records.
 */
async function loadClearanceRecords() {
    if (await fs.pathExists(CLEARANCE_FILE)) {
        return fs.readJson(CLEARANCE_FILE);
    }
    return {}; // Return an empty object if no records exist
}

/**
 * Saves clearance records to the clearance file.
 * @param {Object} clearanceRecords - Clearance records to save.
 */
async function saveClearanceRecords(clearanceRecords) {
    await fs.writeJson(CLEARANCE_FILE, clearanceRecords, { spaces: 2 });
    logInfo("Clearance records saved successfully.");
}

module.exports = {
    validateAccess,
    updateClearanceLevel,
};

// ------------------------------------------------------------------------------
// End of Module: Personnel Clearance Manager
// Version: 2.0.0 | Updated: 2024-11-27
// Change Log: Adapted to tier-based clearance levels for enhanced granularity.
// ------------------------------------------------------------------------------