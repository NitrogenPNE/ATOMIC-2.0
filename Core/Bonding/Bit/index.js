"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Version: 1.0.0
// Module: Bit to Byte Bonding Trigger
//
// Description:
// This script retrieves the first valid address folder from the BITS ledger 
// and triggers the bonding process to create a Byte Atom. It ensures that 
// the bonding process is executed correctly and logs the resulting byte 
// atom's frequency and representation.
//
// Author: Shawn Blackmore
//
// Jurisdiction: 
// This software is governed by the laws of the Province of British Columbia 
// and the laws of Canada applicable therein.
//
// Dependencies:
// - fs-extra: For file system operations.
// - path: For managing and transforming file paths.
// - bitBonding: Module responsible for bonding bit atoms into byte atoms.
//
// Usage:
// Execute the script directly to initiate the bonding process for the first 
// valid address found in the BITS ledger. It will log the bonded Byte Atom 
// and its frequency representation.
//
// Example:
// ```bash
// node bitbonding.js
// ```
//
// Change Log:
// - Version 1.0.0: Initial Release
//
// Contact:
// For inquiries about licensing and usage, please contact licensing@atomic.ca
// ------------------------------------------------------------------------------

const { bondBitsToByte } = require('./script/bitBonding'); // Import bonding logic
const fs = require('fs-extra'); // File system utilities
const path = require('path'); // Utilities for path handling

// Path to the BITS ledger containing address folders
const bitsLedgerBasePath = path.resolve(__dirname, '../../../Ledgers/Frequencies/BITS/');

/**
 * Helper function to get the first valid address folder from the BITS ledger.
 * @returns {Promise<string|null>} - The first valid folder name or null if none found.
 */
async function getFirstAddressFolder() {
    try {
        const folders = await fs.readdir(bitsLedgerBasePath);
        const validFolders = folders.filter(folder =>
            fs.lstatSync(path.join(bitsLedgerBasePath, folder)).isDirectory()
        );
        return validFolders.length > 0 ? validFolders[0] : null;
    } catch (error) {
        console.error('Error reading BITS ledger:', error.message);
        return null;
    }
}

/**
 * Main function to trigger the bonding process.
 */
async function main() {
    try {
        const userAddress = await getFirstAddressFolder(); // Retrieve the first valid address

        if (!userAddress) {
            console.error('No valid address found in the BITS ledger.');
            return;
        }

        console.log(`Bonding bits from address: ${userAddress}`);

        const byteAtom = await bondBitsToByte(userAddress, 0); // Trigger bonding

        if (byteAtom) {
            console.log('Bonded Byte Atom:', byteAtom);
            console.log('Byte Frequency:', byteAtom.frequency);
            console.log(
                'Byte Representation:',
                Buffer.from([parseInt(byteAtom.frequency)]).toString('utf8')
            );
        } else {
            console.error('Bonding process returned no byte atom.');
        }
    } catch (error) {
        console.error('Error bonding byte atom:', error.message);
    }
}

// Execute the main function
main();

// ------------------------------------------------------------------------------
// End of Module: Bit to Byte Bonding Trigger
// Version: 1.0.0 | Updated: 2024-10-30
// Change Log: See CHANGELOG.md for details.
// ------------------------------------------------------------------------------