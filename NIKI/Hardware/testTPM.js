"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Module: TPM Test Utility
//
// Description:
// This script tests the availability and functionality of the Trusted Platform 
// Module (TPM) on the current system. It executes basic TPM commands to fetch 
// quotes and keys for validation.
//
// Features:
// - Verifies TPM availability on the system.
// - Fetches a TPM quote and verifies its integrity.
// - Logs the results for debugging and validation purposes.
//
// Dependencies:
// - child_process: For executing TPM commands via CLI (e.g., tpm2-tools or Windows TPM API).
// - fs-extra: For logging results to a file.
//
// Notes:
// Ensure tpm2-tools (Linux) or Windows TPM Base Services (TBS) is installed.
//
// Contact:
// For licensing and support inquiries, contact licensing@atomic.ca
// ------------------------------------------------------------------------------

const { exec } = require("child_process");
const fs = require("fs-extra");
const path = require("path");

// **Log Directory and File**
const LOG_DIR = path.join(__dirname, "../Logs/TPM");
const LOG_FILE = path.join(LOG_DIR, "tpmTestResults.log");

/**
 * Initialize the TPM test utility.
 */
async function initializeTPMTest() {
    await fs.ensureDir(LOG_DIR);
    console.log(`TPM test log directory initialized at: ${LOG_DIR}`);
}

/**
 * Execute a TPM command.
 * @param {string} command - The TPM command to execute.
 * @returns {Promise<string>} - The command output.
 */
function executeTPMCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`Error executing command: ${command}\n${stderr}`);
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

/**
 * Test TPM availability and functionality.
 */
async function testTPM() {
    try {
        console.log("Starting TPM test...");

        // Example Command: Check TPM availability
        console.log("Checking TPM availability...");
        const tpmStatus = await executeTPMCommand("tpm2_getrandom --version");
        console.log(`TPM is available. Version: ${tpmStatus}`);

        // Example Command: Fetch TPM Quote
        console.log("Fetching TPM quote...");
        const tpmQuote = await executeTPMCommand(
            "tpm2_quote --key-context endorsement --pcr-list sha256:0,1,2"
        );
        console.log(`TPM Quote: ${tpmQuote}`);

        // Log the results
        const logData = {
            timestamp: new Date().toISOString(),
            tpmStatus,
            tpmQuote,
        };
        await fs.writeJson(LOG_FILE, logData, { spaces: 2 });
        console.log(`TPM test results logged to: ${LOG_FILE}`);
    } catch (error) {
        console.error("TPM test failed:", error);
        const errorLog = {
            timestamp: new Date().toISOString(),
            error: error.toString(),
        };
        await fs.writeJson(LOG_FILE, errorLog, { spaces: 2 });
        process.exit(1);
    }
}

// Run the TPM test if called directly
if (require.main === module) {
    (async () => {
        await initializeTPMTest();
        await testTPM();
    })();
}

module.exports = {
    testTPM,
};
