"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// GOVMintingHQNode - Shard Metadata Manager with Disaster Recovery
//
// Description:
// Enhanced shard metadata manager with disaster recovery mechanisms for 
// shard integrity validation and resynchronization.
//
// Enhancements:
// - Scheduled shard integrity audits.
// - Distributed recovery via peer communication.
// - Redundant shard restoration from backups.
//
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const { validateToken } = require("../../Pricing/TokenManagement/tokenValidation");
const { logInfo, logError } = require("../../Logger/logger");
const { retrieveShard, repairShard, requestShardFromPeers } = require("../../Utilities/storageManager");
const schedule = require("node-schedule"); // Add a task scheduler

// Paths for metadata storage
const METADATA_PATH = path.resolve(__dirname, "../../Ledgers/ShardMetadata");

/**
 * Perform integrity audit on shards and recover any corrupted or missing shards.
 * @param {string} tokenId - Token ID for Proof-of-Access.
 * @param {string} encryptedToken - Encrypted token for validation.
 * @param {string} address - Node or user address.
 * @returns {Promise<void>} - Resolves after audit and recovery operations.
 */
async function auditAndRecoverShards(tokenId, encryptedToken, address) {
    try {
        console.log("Validating token for shard audit...");
        const tokenValidation = await validateToken(tokenId, encryptedToken);

        if (!tokenValidation.valid) {
            throw new Error("Token validation failed: Access denied.");
        }

        const metadataFilePath = path.join(METADATA_PATH, `${address}-shardMetadata.json`);
        if (!(await fs.pathExists(metadataFilePath))) {
            throw new Error(`No shard metadata found for address: ${address}`);
        }

        const metadata = await fs.readJson(metadataFilePath);
        let recoveryNeeded = false;

        // Perform integrity checks on each shard
        for (const entry of metadata) {
            for (const atom of entry.atoms) {
                try {
                    const shard = await retrieveShard(atom.type, atom.node);
                    const calculatedHash = crypto.createHash("sha256").update(shard).digest("hex");

                    if (calculatedHash !== atom.hash) {
                        throw new Error(`Hash mismatch for shard ${atom.node}`);
                    }
                } catch (error) {
                    logError(`Integrity check failed for shard ${atom.node}: ${error.message}`);
                    recoveryNeeded = true;

                    // Attempt local recovery
                    const recovered = await repairShard(atom.type, atom.node);
                    if (recovered) {
                        logInfo(`Shard ${atom.node} successfully recovered locally.`);
                        continue;
                    }

                    // Request recovery from peers
                    logInfo(`Requesting shard recovery from peers for shard ${atom.node}...`);
                    const peerShard = await requestShardFromPeers(atom.type, atom.node);
                    if (peerShard) {
                        logInfo(`Shard ${atom.node} recovered from peers successfully.`);
                    } else {
                        logError(`Failed to recover shard ${atom.node} from peers or backups.`);
                    }
                }
            }
        }

        if (!recoveryNeeded) {
            logInfo(`Shard audit completed successfully for address: ${address}. All shards are intact.`);
        }
    } catch (error) {
        logError("Shard audit and recovery failed.", { error: error.message });
        throw error;
    }
}

/**
 * Schedule periodic shard integrity audits using a task scheduler.
 * @param {string} address - Node or user address.
 * @param {string} tokenId - Token ID for Proof-of-Access validation.
 * @param {string} encryptedToken - Encrypted token for validation.
 */
function scheduleShardIntegrityAudits(address, tokenId, encryptedToken) {
    // Schedule audits to run every hour
    schedule.scheduleJob("0 * * * *", async () => {
        try {
            logInfo(`Starting scheduled shard integrity audit for address: ${address}...`);
            await auditAndRecoverShards(tokenId, encryptedToken, address);
        } catch (error) {
            logError("Scheduled shard integrity audit failed.", { error: error.message });
        }
    });

    logInfo(`Scheduled shard integrity audits for address: ${address}.`);
}

module.exports = {
    auditAndRecoverShards,
    scheduleShardIntegrityAudits,
};

// ------------------------------------------------------------------------------
// End of Module: Shard Metadata Manager with Disaster Recovery
// Version: GOVMintHQNode | Updated: 2024-12-03
// ------------------------------------------------------------------------------
