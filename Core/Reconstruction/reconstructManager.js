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
// Centralized manager for coordinating the reconstruction of data from bit atoms.
// Supports fusion, validation, and redundancy checks across distributed nodes.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const { atomFusionProcess } = require("./atomFusion");
const { validateByteAtom } = require("../Validation/atomValidator");
const { logInfo, logError } = require("./logger");

/**
 * Main manager for data reconstruction.
 * @param {string} userAddress - User's address for data retrieval.
 * @param {string} duration - The duration pool to retrieve data from.
 * @returns {Object|null} - Reconstructed data or null on failure.
 */
async function reconstructData(userAddress, duration) {
    logInfo(`Starting data reconstruction for User: ${userAddress}, Duration: ${duration}`);

    try {
        // Step 1: Run Atom Fusion Process
        const reconstructedData = await atomFusionProcess(userAddress, duration);
        if (!reconstructedData) {
            throw new Error("Atom Fusion process failed. Unable to reconstruct data.");
        }

        logInfo("Atom Fusion completed successfully. Proceeding to validation...");

        // Step 2: Validate Reconstructed Data
        const isValid = validateReconstructedData(reconstructedData);
        if (!isValid) {
            throw new Error("Reconstructed data failed validation.");
        }

        logInfo("Data reconstruction and validation successful.");
        return reconstructedData;
    } catch (error) {
        logError(`Reconstruction failed for User: ${userAddress}, Error: ${error.message}`);
        return null;
    }
}

/**
 * Validates the reconstructed data for integrity and consistency.
 * @param {Object} data - The reconstructed data.
 * @returns {boolean} - True if the data is valid, otherwise false.
 */
function validateReconstructedData(data) {
    try {
        // Validate individual byte atoms in the reconstructed data
        const allAtomsValid = data.bitAtoms.every(atom => validateByteAtom(atom));
        if (!allAtomsValid) {
            logError("Validation failed for one or more byte atoms in the reconstructed data.");
            return false;
        }

        // Add additional validation logic if required
        logInfo("All byte atoms validated successfully.");
        return true;
    } catch (error) {
        logError(`Error during data validation: ${error.message}`);
        return false;
    }
}

/**
 * Orchestrates reconstruction for multiple users or nodes.
 * @param {Array<string>} userAddresses - List of user addresses to process.
 * @param {string} duration - The duration pool for reconstruction.
 * @returns {Promise<Array<Object>>} - Array of results for each user's reconstruction.
 */
async function orchestrateReconstruction(userAddresses, duration) {
    logInfo("Starting reconstruction orchestration...");
    const results = [];

    for (const address of userAddresses) {
        const result = await reconstructData(address, duration);
        results.push({ userAddress: address, result });
    }

    logInfo("Reconstruction orchestration completed.");
    return results;
}

module.exports = {
    reconstructData,
    validateReconstructedData,
    orchestrateReconstruction,
};

// ------------------------------------------------------------------------------
// End of Reconstruction Manager Module
// Version: 1.0.0 | Updated: 2024-11-28
// ------------------------------------------------------------------------------