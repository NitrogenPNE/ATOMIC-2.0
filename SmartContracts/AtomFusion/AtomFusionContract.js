"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Atom Fusion Contract
//
// Description:
// This smart contract handles retrieval and validation of bit atoms across 
// distributed nodes. Provides methods to fetch user-specific and pool-specific
// atoms while ensuring compliance with node-specific redundancy policies.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const { logInfo, logError } = require("../../../Logs/logger");

// Paths
const LEDGER_BASE_PATH = path.resolve(__dirname, "../../../Ledgers/Frequencies");
const NODE_LEDGER_PATH = path.resolve(__dirname, "../../../Ledgers/Mining");

/**
 * Retrieve user-specific atoms from their ledger.
 * @param {string} userAddress - User's unique address.
 * @returns {Promise<Array<Object>>} - Array of user-specific bit atoms.
 */
async function getUserAtoms(userAddress) {
    try {
        logInfo(`Fetching atoms for user: ${userAddress}`);
        const atomTypes = ["BITS", "BYTES", "KB", "MB", "GB", "TB"];
        let userAtoms = [];

        for (const type of atomTypes) {
            const userFilePath = path.join(LEDGER_BASE_PATH, type, userAddress, `${type.toLowerCase()}Atoms.json`);
            if (await fs.pathExists(userFilePath)) {
                const data = await fs.readJson(userFilePath);
                userAtoms = userAtoms.concat(data);
            }
        }

        logInfo(`Retrieved ${userAtoms.length} atoms for user: ${userAddress}`);
        return userAtoms;
    } catch (error) {
        logError(`Error fetching user atoms for ${userAddress}: ${error.message}`);
        return [];
    }
}

/**
 * Retrieve atoms from the pool for a given duration.
 * @param {string} duration - Duration pool to retrieve atoms from.
 * @returns {Promise<Array<Object>>} - Array of pooled bit atoms.
 */
async function getPoolAtoms(duration) {
    try {
        logInfo(`Fetching pool atoms for duration: ${duration}`);
        const atomTypes = ["BITS", "BYTES", "KB", "MB", "GB", "TB"];
        let poolAtoms = [];

        for (const type of atomTypes) {
            const poolFilePath = path.join(NODE_LEDGER_PATH, type, `${duration}_${type.toLowerCase()}Atoms.json`);
            if (await fs.pathExists(poolFilePath)) {
                const data = await fs.readJson(poolFilePath);
                poolAtoms = poolAtoms.concat(data);
            }
        }

        logInfo(`Retrieved ${poolAtoms.length} atoms from pool for duration: ${duration}`);
        return poolAtoms;
    } catch (error) {
        logError(`Error fetching pool atoms for duration ${duration}: ${error.message}`);
        return [];
    }
}

/**
 * Validate the integrity of atoms fetched from ledgers.
 * @param {Array<Object>} atoms - Array of bit atoms to validate.
 * @returns {Array<Object>} - Array of validated atoms.
 */
function validateAtoms(atoms) {
    try {
        const validAtoms = atoms.filter((atom) => atom && atom.bit !== undefined && atom.frequency > 0);
        logInfo(`Validated ${validAtoms.length} of ${atoms.length} atoms.`);
        return validAtoms;
    } catch (error) {
        logError(`Error validating atoms: ${error.message}`);
        return [];
    }
}

module.exports = {
    getUserAtoms,
    getPoolAtoms,
    validateAtoms,
};

// ------------------------------------------------------------------------------
// End of Module: Atom Fusion Contract
// Version: 1.0.0 | Updated: 2024-11-28
// ------------------------------------------------------------------------------
