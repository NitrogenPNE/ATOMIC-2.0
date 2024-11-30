"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Version: 1.0.0
// Module: Entry Point for Byte-KB Bonding System
//
// Description:
// This is the main entry point for the byte-to-KB bonding system. It triggers 
// the bonding process by aggregating byte atoms into KB atoms and ensures that 
// address synchronization is maintained across the system.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - './byteBonding': For bonding byte atoms into KB atoms.
// - fs-extra: For file system operations.
// - path: For path handling.
//
// Usage:
// Run this module to trigger the bonding process or synchronize ledgers:
// ```bash
// node index.js
// ```
//
// Contact:
// For inquiries regarding licensing or usage, please contact:
// - Email: licensing@atomic.ca
// - Website: https://www.atomic.ca
// ------------------------------------------------------------------------------

const { bondBytesToKb } = require('./script/byteBonding'); // Bonding logic import
const fs = require('fs-extra'); // File system utilities
const path = require('path'); // Path resolution utilities

// Base path to the BYTES ledger where user data is stored
const bytesLedgerBasePath = path.resolve(__dirname, '../../../Ledgers/Frequencies/BYTES/');

/**
 * Helper function to retrieve the first valid address folder from the BYTES ledger.
 * @returns {Promise<string|null>} - Returns the address folder or null if none found.
 */
async function getFirstAddressFolder() {
    try {
        const folders = await fs.readdir(bytesLedgerBasePath);
        const validFolders = folders.filter(folder =>
            fs.lstatSync(path.join(bytesLedgerBasePath, folder)).isDirectory()
        );
        return validFolders.length > 0 ? validFolders[0] : null;
    } catch (error) {
        console.error('Error reading BYTES ledger:', error.message);
        return null;
    }
}

/**
 * Main function to initiate bonding of bytes into a KB atom.
 */
async function main() {
    try {
        const userAddress = await getFirstAddressFolder(); // Get a valid address folder

        if (!userAddress) {
            console.error('No valid address found in the BYTES ledger.');
            return;
        }

        console.log(`Bonding bytes from address: ${userAddress}`);

        // Attempt to bond bytes into a KB atom
        const kbAtom = await bondBytesToKb(userAddress, 0);

        if (kbAtom) {
            console.log('Bonded KB Atom:', kbAtom);
            console.log('KB Frequency:', kbAtom.frequency);
            console.log(
                'KB Representation:',
                Buffer.from([parseInt(kbAtom.frequency)]).toString('utf8')
            );
        } else {
            console.error('Bonding process returned no KB atom.');
        }
    } catch (error) {
        console.error('Error during KB bonding:', error.message);
    }
}

// Execute the main function
main();

// ------------------------------------------------------------------------------
// End of Module: Entry Point for Byte-KB Bonding System
// Version: 1.0.0 | Updated: 2024-10-30
// Change Log: See CHANGELOG.md for details.
// ------------------------------------------------------------------------------
