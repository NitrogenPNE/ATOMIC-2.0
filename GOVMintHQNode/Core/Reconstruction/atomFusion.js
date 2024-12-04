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
// Reconstructs data and node structures from distributed bit atoms using multi-node redundancy.
// Logs reconstruction events on the blockchain for compliance and integrates
// validation with National Defense HQNode ledger policies.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const { getUserAtoms, getPoolAtoms, getNodeAtoms } = require("../../SmartContracts/AtomFusion/atomFusionContract");
const { validateByteAtom } = require("../Validation/atomValidator");
const { logInfo, logError } = require("../../Logs/logger");
const { createBlockchainEntry } = require("../../SmartContracts/LedgerContract");
const { reconstructNode } = require("../../Utilities/shardNodeCommunicator");
const fs = require("fs-extra");
const path = require("path");

// Paths
const FUSION_LOG_PATH = path.resolve(__dirname, "../../Logs/FusionLogs");
const RECONSTRUCTION_BACKUP_PATH = path.resolve(__dirname, "../../Backup/ReconstructedData");

/**
 * Atom Fusion Process: Reconstructs data and node structures.
 * @param {string} userAddress - User's address or node ID for reconstruction.
 * @param {string} duration - Duration pool for atom retrieval.
 * @param {boolean} reconstructNodeStructure - Flag to indicate node reconstruction.
 * @returns {Object|null} - Reconstructed data or node structure, or null if fusion fails.
 */
async function atomFusionProcess(userAddress, duration, reconstructNodeStructure = false) {
    try {
        logInfo(
            `Starting Atom Fusion process for ${reconstructNodeStructure ? "Node" : "User"}: ${userAddress}, Duration: ${duration}`
        );

        // Ensure Fusion Logs Directory
        await fs.ensureDir(FUSION_LOG_PATH);

        // Step 1: Retrieve atoms
        const atoms = reconstructNodeStructure
            ? await getNodeAtoms(userAddress)
            : await getUserAtoms(userAddress);

        if (!Array.isArray(atoms) || atoms.length === 0) {
            logError(`No atoms found for ${reconstructNodeStructure ? "Node" : "User"}: ${userAddress}`);
            return null;
        }

        // Step 2: Retrieve additional atoms from the pool
        const poolAtoms = await getPoolAtoms(duration);
        if (!Array.isArray(poolAtoms) || poolAtoms.length === 0) {
            logError(`No atoms found in ${duration} pool.`);
            return null;
        }

        const allAtoms = [...atoms, ...poolAtoms];

        // Step 3: Validate atoms
        const validAtoms = allAtoms.filter((atom) => validateByteAtom(atom));
        if (validAtoms.length === 0) {
            logError("Failed to validate any byte atoms.");
            return null;
        }

        logInfo(`Validated ${validAtoms.length} atoms for fusion.`);

        if (reconstructNodeStructure) {
            // Reconstruct node from atoms
            const reconstructedNode = await reconstructNode(userAddress, validAtoms);
            if (!reconstructedNode) {
                logError("Node reconstruction failed.");
                return null;
            }

            logInfo(`Node reconstruction successful for Node ID: ${userAddress}`);
            return reconstructedNode;
        } else {
            // Step 4: Reconstruct data
            const reconstructedData = reconstructData(validAtoms);
            if (!reconstructedData) {
                logError("Data reconstruction failed.");
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

            // Step 6: Log reconstruction event
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
        }
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
// Version: 3.0.0 | Updated: 2024-12-03
// Change Log:
// - Added node structure reconstruction.
// - Enhanced logging for fusion and reconstruction events.
// ------------------------------------------------------------------------------