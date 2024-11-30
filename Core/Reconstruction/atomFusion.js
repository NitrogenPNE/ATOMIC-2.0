"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Atom Fusion Process
//
// Description:
// Reconstructs data from distributed bit atoms using multi-node redundancy.
// Logs reconstruction events on the blockchain for compliance and integrates
// validation with National Defense HQNode ledger policies.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const { getUserAtoms, getPoolAtoms } = require("../../SmartContracts/AtomFusion/atomFusionContract");
const { validateByteAtom } = require("../Validation/atomValidator");
const { logInfo, logError } = require("../../Logs/logger");
const { createBlockchainEntry } = require("../../SmartContracts/LedgerContract");
const fs = require("fs-extra");
const path = require("path");

// Paths
const FUSION_LOG_PATH = path.resolve(__dirname, "../../Logs/FusionLogs");
const RECONSTRUCTION_BACKUP_PATH = path.resolve(__dirname, "../../Backup/ReconstructedData");

/**
 * Atom Fusion Process: Reconstructs data from bit atoms distributed across pools.
 * @param {string} userAddress - User's address for data retrieval.
 * @param {string} duration - Duration pool for atom retrieval.
 * @returns {Object|null} - Reconstructed data or null if fusion fails.
 */
async function atomFusionProcess(userAddress, duration) {
    try {
        logInfo(`Starting Atom Fusion process for User: ${userAddress}, Duration: ${duration}`);

        // Ensure Fusion Logs Directory
        await fs.ensureDir(FUSION_LOG_PATH);

        // Step 1: Retrieve bit atoms from the user's ledger
        const userAtoms = await getUserAtoms(userAddress);
        if (!Array.isArray(userAtoms) || userAtoms.length === 0) {
            logError(`No atoms found for User: ${userAddress}`);
            return null;
        }

        // Step 2: Retrieve additional atoms from the pool by duration
        const poolAtoms = await getPoolAtoms(duration);
        if (!Array.isArray(poolAtoms) || poolAtoms.length === 0) {
            logError(`No atoms found in ${duration} pool.`);
            return null;
        }

        // Combine user atoms and pool atoms for reconstruction
        const allAtoms = [...userAtoms, ...poolAtoms];

        // Step 3: Validate the structure of byte atoms for consistency
        const validAtoms = allAtoms.filter((atom) => validateByteAtom(atom));
        if (validAtoms.length === 0) {
            logError("Failed to validate any byte atoms.");
            return null;
        }

        logInfo(`Validated ${validAtoms.length} atoms for fusion.`);

        // Step 4: Reconstruct the original data from the bit atoms
        const reconstructedData = reconstructData(validAtoms);
        if (!reconstructedData) {
            logError("Failed to reconstruct data from atoms.");
            return null;
        }

        logInfo("Data reconstruction successful.");

        // Step 5: Backup reconstructed data
        const backupFilePath = path.join(
            RECONSTRUCTION_BACKUP_PATH,
            `${userAddress}_${Date.now()}_reconstructed.json`
        );
        await fs.ensureDir(RECONSTRUCTION_BACKUP_PATH);
        await fs.writeJson(backupFilePath, reconstructedData, { spaces: 2 });
        logInfo(`Reconstructed data backed up at: ${backupFilePath}`);

        // Step 6: Log reconstruction event to blockchain
        const metadata = {
            eventType: "Fusion",
            userAddress,
            duration,
            atomCount: validAtoms.length,
            timestamp: new Date().toISOString(),
        };
        const txHash = await createBlockchainEntry(userAddress, metadata);
        logInfo(`Fusion event logged on blockchain. Tx Hash: ${txHash}`);

        return reconstructedData;
    } catch (error) {
        logError(`Error during Atom Fusion: ${error.message}`);
        return null;
    }
}

/**
 * Reconstructs the original data from bit atoms.
 * @param {Array<Object>} bitAtoms - Array of bit atoms with their values.
 * @returns {any} - The reconstructed original data or null if parsing fails.
 */
function reconstructData(bitAtoms) {
    try {
        const binaryString = bitAtoms.map((atom) => atom.bit).join(""); // Joining bits
        const buffer = Buffer.from(binaryString, "binary");
        return JSON.parse(buffer.toString()); // Parse JSON from buffer
    } catch (error) {
        logError(`Data reconstruction error: ${error.message}`);
        return null; // Return null on failure to reconstruct
    }
}

module.exports = { atomFusionProcess };

// ------------------------------------------------------------------------------
// End of Module: Atom Fusion Process
// Version: 2.0.0 | Updated: 2024-11-28
// ------------------------------------------------------------------------------