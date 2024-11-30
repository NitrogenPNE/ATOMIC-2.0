"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Smart Contract: GB Bonding Contract
//
// Description:
// This smart contract handles the validation, verification, and recording of 
// bonding operations at the GB level. It ensures that the structure and data 
// consistency of GB atoms meet the requirements for bonding into TB atoms. 
// Additionally, it records metadata and generates events for tracking.
//
// Author: Shawn Blackmore
//
// Usage:
// This module is used in conjunction with GB → TB bonding scripts. Call 
// `validateStructure` to validate atoms before bonding, and use 
// `recordBond` to log the operation.
//
// Example:
// ```javascript
// const GbBondingContract = require('./GbBondingContract');
// GbBondingContract.validateStructure(protonAtoms, electronAtoms, neutronAtoms);
// GbBondingContract.recordBond(tbIndex, userAddress);
// ```
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");

// Paths for contract metadata
const CONTRACT_LOG_PATH = path.resolve(__dirname, "../../../../Logs/Contracts/GB/gbBondingLog.json");

/**
 * Validates the structure and metadata of GB atoms for bonding.
 * @param {Array} protonAtoms - Array of proton GB atoms.
 * @param {Array} electronAtoms - Array of electron GB atoms.
 * @param {Array} neutronAtoms - Array of neutron GB atoms.
 * @throws {Error} - If the validation fails.
 */
function validateStructure(protonAtoms, electronAtoms, neutronAtoms) {
    console.log("Validating GB atom structure...");

    // Ensure sufficient atoms for bonding
    if (protonAtoms.length < 1024 || electronAtoms.length < 1024 || neutronAtoms.length < 1024) {
        throw new Error("Insufficient GB atoms for bonding.");
    }

    // Check metadata consistency
    const timestamps = new Set();
    const ivs = new Set();
    const authTags = new Set();

    [...protonAtoms, ...electronAtoms, ...neutronAtoms].forEach((atom) => {
        timestamps.add(atom.timestamp);
        ivs.add(atom.iv);
        authTags.add(atom.authTag);
    });

    if (timestamps.size > 1) {
        throw new Error("Inconsistent timestamps in GB atoms.");
    }

    if (ivs.size > 1 || authTags.size > 1) {
        throw new Error("Inconsistent encryption metadata (IV/AuthTag) in GB atoms.");
    }

    console.log("GB atom structure validated successfully.");
}

/**
 * Records a GB → TB bonding operation in the contract log.
 * @param {number} tbIndex - The index of the TB atom being created.
 * @param {string} userAddress - The address of the user associated with the bonding operation.
 */
function recordBond(tbIndex, userAddress) {
    console.log(`Recording GB → TB bonding operation for TB Index: ${tbIndex}, User Address: ${userAddress}`);

    const bondRecord = {
        tbIndex,
        userAddress,
        timestamp: new Date().toISOString(),
        status: "Bonded",
    };

    const log = loadLog();
    log.push(bondRecord);
    saveLog(log);

    console.log("Bonding operation recorded successfully.");
}

/**
 * Loads the contract log from the filesystem.
 * @returns {Array} - Array of recorded bond operations.
 */
function loadLog() {
    try {
        if (fs.existsSync(CONTRACT_LOG_PATH)) {
            return fs.readJsonSync(CONTRACT_LOG_PATH);
        } else {
            console.warn(`Contract log not found at ${CONTRACT_LOG_PATH}. Initializing new log.`);
            return [];
        }
    } catch (error) {
        console.error(`Error reading contract log: ${error.message}`);
        return [];
    }
}

/**
 * Saves the contract log to the filesystem.
 * @param {Array} log - Array of bond operation records to save.
 */
function saveLog(log) {
    try {
        fs.ensureFileSync(CONTRACT_LOG_PATH);
        fs.writeJsonSync(CONTRACT_LOG_PATH, log, { spaces: 2 });
        console.log(`Contract log saved successfully to ${CONTRACT_LOG_PATH}`);
    } catch (error) {
        console.error(`Error saving contract log: ${error.message}`);
    }
}

module.exports = { validateStructure, recordBond };

// ------------------------------------------------------------------------------
// End of Smart Contract: GB Bonding Contract
// Version: 1.0.0 | Updated: 2024-11-28
// ------------------------------------------------------------------------------ 
