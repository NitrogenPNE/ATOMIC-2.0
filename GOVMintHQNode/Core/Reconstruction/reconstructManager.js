"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Reconstruction Manager
//
// Description:
// Centralized manager for coordinating the reconstruction of data and nodes from bit atoms.
// Supports fusion, validation, redundancy checks, and multi-node recovery.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const { atomFusionProcess } = require("./atomFusion");
const { validateByteAtom } = require("../../Validation/atomValidator");
const { logInfo, logError } = require("../../Logs/logger");
const { synchronizeNodeCommunication } = require("../../Utilities/shardNodeCommunicator");

/**
 * Main manager for data or node reconstruction.
 * @param {string} identifier - User address or node ID for reconstruction.
 * @param {string} duration - The duration pool to retrieve data from.
 * @param {boolean} isNode - Indicates if reconstruction is for a node.
 * @returns {Object|null} - Reconstructed data or node structure, or null on failure.
 */
async function reconstruct(identifier, duration, isNode = false) {
    logInfo(
        `Starting ${isNode ? "Node" : "Data"} reconstruction for Identifier: ${identifier}, Duration: ${duration}`
    );

    try {
        // Step 1: Run Atom Fusion Process for data or node reconstruction
        const reconstructedEntity = await atomFusionProcess(identifier, duration, isNode);
        if (!reconstructedEntity) {
            throw new Error(`${isNode ? "Node" : "Data"} Fusion process failed.`);
        }

        logInfo(`${isNode ? "Node" : "Data"} Fusion completed successfully. Proceeding to validation...`);

        // Step 2: Validate the reconstructed entity (data or node structure)
        const isValid = isNode
            ? await validateReconstructedNode(reconstructedEntity)
            : validateReconstructedData(reconstructedEntity);

        if (!isValid) {
            throw new Error(`${isNode ? "Node" : "Data"} reconstruction failed validation.`);
        }

        logInfo(`${isNode ? "Node" : "Data"} reconstruction and validation successful.`);
        return reconstructedEntity;
    } catch (error) {
        logError(`Reconstruction failed for Identifier: ${identifier}, Error: ${error.message}`);
        return null;
    }
}

/**
 * Validates reconstructed data for integrity and consistency.
 * @param {Object} data - The reconstructed data.
 * @returns {boolean} - True if the data is valid, otherwise false.
 */
function validateReconstructedData(data) {
    try {
        const allAtomsValid = data.bitAtoms.every((atom) => validateByteAtom(atom));
        if (!allAtomsValid) {
            logError("Validation failed for one or more byte atoms in the reconstructed data.");
            return false;
        }

        logInfo("All byte atoms in reconstructed data validated successfully.");
        return true;
    } catch (error) {
        logError(`Error during data validation: ${error.message}`);
        return false;
    }
}

/**
 * Validates reconstructed node structures for operational consistency.
 * @param {Object} node - The reconstructed node structure.
 * @returns {Promise<boolean>} - True if the node is valid, otherwise false.
 */
async function validateReconstructedNode(node) {
    try {
        logInfo("Validating reconstructed node structure...");
        const isSynchronized = await synchronizeNodeCommunication(node);

        if (!isSynchronized) {
            logError("Node validation failed: Communication synchronization failed.");
            return false;
        }

        logInfo("Reconstructed node validated successfully.");
        return true;
    } catch (error) {
        logError(`Error during node validation: ${error.message}`);
        return false;
    }
}

/**
 * Orchestrates reconstruction for multiple identifiers (users or nodes).
 * @param {Array<string>} identifiers - List of user addresses or node IDs to process.
 * @param {string} duration - The duration pool for reconstruction.
 * @param {boolean} isNode - Indicates if reconstruction is for nodes.
 * @returns {Promise<Array<Object>>} - Array of results for each reconstruction.
 */
async function orchestrateReconstruction(identifiers, duration, isNode = false) {
    logInfo(`Starting ${isNode ? "Node" : "Data"} reconstruction orchestration...`);
    const results = [];

    for (const identifier of identifiers) {
        const result = await reconstruct(identifier, duration, isNode);
        results.push({ identifier, result });
    }

    logInfo(`${isNode ? "Node" : "Data"} reconstruction orchestration completed.`);
    return results;
}

module.exports = {
    reconstruct,
    validateReconstructedData,
    validateReconstructedNode,
    orchestrateReconstruction,
};

// ------------------------------------------------------------------------------
// End of Reconstruction Manager Module
// Version: 2.0.0 | Updated: 2024-12-03
// Change Log:
// - Added node reconstruction capabilities.
// - Enhanced logging and validation for data and node entities.
// ------------------------------------------------------------------------------