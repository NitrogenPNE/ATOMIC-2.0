"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Atom Validator
//
// Description:
// Provides validation mechanisms for byte atoms and node integrity checks. 
// Ensures atomic-level consistency and tamper detection using quantum-resistant 
// cryptographic hashing.
//
// Dependencies:
// - crypto: For hash verification.
// - loggingUtils.js: Logs validation operations.
//
// Author: ATOMIC Development Team
// ------------------------------------------------------------------------------

const crypto = require("crypto");
const { logInfo, logError } = require("../Logs/logger");

/**
 * Validates the integrity of a single byte atom.
 * @param {Object} atom - The atom to validate.
 * @param {string} atom.bit - The binary bit value of the atom.
 * @param {string} atom.hash - The hash of the atom for integrity verification.
 * @param {Object} atom.metadata - Additional metadata for validation (optional).
 * @returns {boolean} - True if the atom is valid, otherwise false.
 */
function validateByteAtom(atom) {
    try {
        if (!atom || typeof atom.bit === "undefined" || !atom.hash) {
            logError("Invalid atom structure detected.", { atom });
            return false;
        }

        // Recalculate the hash for the atom
        const recalculatedHash = crypto
            .createHash("sha256")
            .update(JSON.stringify({ bit: atom.bit, metadata: atom.metadata }))
            .digest("hex");

        if (recalculatedHash !== atom.hash) {
            logError("Atom hash mismatch detected.", { atom });
            return false;
        }

        logInfo("Byte atom validated successfully.", { atom });
        return true;
    } catch (error) {
        logError("Error during byte atom validation.", { atom, error: error.message });
        return false;
    }
}

/**
 * Validates the integrity of a reconstructed node structure.
 * @param {Object} node - The node structure to validate.
 * @param {Array<Object>} node.shards - Array of shard metadata associated with the node.
 * @param {string} node.nodeId - Unique identifier for the node.
 * @param {Object} node.metadata - Additional metadata for validation.
 * @returns {boolean} - True if the node is valid, otherwise false.
 */
function validateNodeIntegrity(node) {
    try {
        if (!node || !node.nodeId || !Array.isArray(node.shards)) {
            logError("Invalid node structure detected.", { node });
            return false;
        }

        for (const shard of node.shards) {
            const recalculatedHash = crypto
                .createHash("sha256")
                .update(JSON.stringify(shard))
                .digest("hex");

            if (recalculatedHash !== shard.hash) {
                logError(`Node shard hash mismatch detected for Node ID: ${node.nodeId}`, { shard });
                return false;
            }
        }

        logInfo(`Node integrity validated successfully for Node ID: ${node.nodeId}`);
        return true;
    } catch (error) {
        logError("Error during node integrity validation.", { node, error: error.message });
        return false;
    }
}

/**
 * Performs tamper detection for a pool of atoms.
 * @param {Array<Object>} atoms - Array of byte atoms.
 * @returns {boolean} - True if all atoms are valid, otherwise false.
 */
function detectTampering(atoms) {
    try {
        if (!Array.isArray(atoms) || atoms.length === 0) {
            logError("Invalid or empty atom pool provided for tamper detection.");
            return false;
        }

        const invalidAtoms = atoms.filter((atom) => !validateByteAtom(atom));
        if (invalidAtoms.length > 0) {
            logError(`Tampering detected: ${invalidAtoms.length} invalid atoms.`, { invalidAtoms });
            return false;
        }

        logInfo("No tampering detected. All atoms validated successfully.");
        return true;
    } catch (error) {
        logError("Error during tamper detection.", { atoms, error: error.message });
        return false;
    }
}

module.exports = {
    validateByteAtom,
    validateNodeIntegrity,
    detectTampering,
};

// ------------------------------------------------------------------------------
// End of Module: Atom Validator
// Version: 1.0.0 | Updated: 2024-12-03
// Change Log:
// - Added validation for byte atoms and node integrity.
// - Integrated logging for detailed validation reporting.
// ------------------------------------------------------------------------------
