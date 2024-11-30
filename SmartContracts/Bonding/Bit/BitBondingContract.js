"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Smart Contract for Bit Bonding (BITS → BYTES)
//
// Description:
// This contract manages and validates bonding operations from BITS to BYTES.
// It records each bonded byte in the blockchain ledger for traceability, 
// ensuring compliance with ATOMIC's security and integrity standards.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const { logInfo, logError } = require("../../../../Logger/logger");
const { addBlockchainRecord } = require("../../../../atomic-blockchain/ledgerManager");

/**
 * Validates the bonding operation for a byte atom.
 * @param {string} userAddress - User's address involved in the bonding process.
 * @param {Object} byteAtom - The byte atom being bonded.
 * @throws {Error} If validation fails.
 */
function validateBond(userAddress, byteAtom) {
    try {
        if (!userAddress || typeof userAddress !== "string") {
            throw new Error("Invalid user address.");
        }

        if (
            !byteAtom ||
            typeof byteAtom !== "object" ||
            !byteAtom.type ||
            byteAtom.type !== "BYTE" ||
            !Array.isArray(byteAtom.atomsUsed) ||
            byteAtom.atomsUsed.length !== 24
        ) {
            throw new Error("Invalid byte atom structure or insufficient atoms for bonding.");
        }

        logInfo(`Bond validation passed for user: ${userAddress}, Byte Index: ${byteAtom.byteIndex}`);
    } catch (error) {
        logError(`Bond validation failed: ${error.message}`);
        throw error;
    }
}

/**
 * Records a bonded byte in the blockchain ledger.
 * @param {string} userAddress - The user address performing the bonding.
 * @param {Object} byteAtom - The byte atom to record.
 * @throws {Error} If the blockchain operation fails.
 */
async function recordBond(userAddress, byteAtom) {
    try {
        validateBond(userAddress, byteAtom);

        const blockchainRecord = {
            userAddress,
            byteIndex: byteAtom.byteIndex,
            type: byteAtom.type,
            timestamp: byteAtom.timestamp,
            frequency: byteAtom.frequency,
            atomicWeight: byteAtom.atomicWeight,
            atomsUsedCount: byteAtom.atomsUsed.length,
        };

        await addBlockchainRecord("ByteBonding", blockchainRecord);
        logInfo(`Bond successfully recorded for Byte Index: ${byteAtom.byteIndex}, User: ${userAddress}`);
    } catch (error) {
        logError(`Failed to record bond: ${error.message}`);
        throw error;
    }
}

module.exports = { validateBond, recordBond };
