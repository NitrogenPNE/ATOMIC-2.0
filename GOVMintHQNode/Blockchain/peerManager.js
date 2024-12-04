"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * GOVMintHQNode Peer Manager
 *
 * Description:
 * Manages peer discovery, communication, and metadata for the GOVMintHQNode within
 * the ATOMIC network. Incorporates PoA validation, security, and scalability optimizations.
 *
 * Dependencies:
 * - enhancedPeerDiscovery.js: Advanced peer discovery for the ATOMIC blockchain.
 * - networkManager.js: Manages peer-to-peer communication.
 * - proofOfAccessValidator.js: Validates Proof-of-Access for peers.
 * - loggingUtils.js: Logs operations for debugging and auditing.
 *
 * Author: GOVMintHQNode Integration Team
 * -------------------------------------------------------------------------------
 */

const path = require("path");
const { discoverPeers, getDiscoveredPeers } = require(path.resolve(__dirname, "../../atomic-blockchain/core/enhancedPeerDiscovery.js"));
const { sendToPeer, receiveFromPeer, broadcastToPeers } = require(path.resolve(__dirname, "../../atomic-blockchain/core/networkManager.js"));
const { validatePoA } = require(path.resolve(__dirname, "../../atomic-blockchain/core/proofOfAccessValidator.js"));
const { logOperation, logError } = require(path.resolve(__dirname, "../Utilities/loggingUtils.js"));

// Configuration for GOVMintHQNode peer management
const PEER_MANAGER_CONFIG = {
    maxPeers: process.env.MAX_PEERS || 50,
    discoveryInterval: 60000, // Discover peers every 60 seconds
    retryOnFailure: 3, // Retry count for failed communication
};

// In-memory store for active peers
let activePeers = [];

/**
 * Initialize the GOVMintHQNode peer manager.
 * - Discovers peers using enhanced peer discovery.
 * - Starts periodic peer discovery.
 * - Validates peers' Proof-of-Access (PoA).
 */
async function initializePeerManager() {
    try {
        logOperation("Initializing GOVMintHQNode Peer Manager...");
        activePeers = await discoverPeers();
        activePeers = await filterValidPeers(activePeers);
        logOperation(`Initial active peers: ${activePeers.join(", ")}`);

        // Periodic peer discovery
        setInterval(async () => {
            try {
                logOperation("Running periodic peer discovery...");
                const newPeers = await discoverPeers();
                const validPeers = await filterValidPeers(newPeers);
                activePeers = [...new Set([...activePeers, ...validPeers])]; // Deduplicate peers
                logOperation(`Updated active peers: ${activePeers.join(", ")}`);
            } catch (error) {
                logError("Periodic peer discovery failed.", error.message);
            }
        }, PEER_MANAGER_CONFIG.discoveryInterval);
    } catch (error) {
        logError("Failed to initialize peer manager.", error.message);
        throw error;
    }
}

/**
 * Validate peers' Proof-of-Access (PoA).
 * @param {Array<string>} peers - List of peer addresses.
 * @returns {Promise<Array<string>>} - List of valid peers.
 */
async function filterValidPeers(peers) {
    const validPeers = [];
    for (const peer of peers) {
        try {
            const isValid = await validatePoA(peer);
            if (isValid) {
                validPeers.push(peer);
                logOperation(`Peer validated successfully: ${peer}`);
            } else {
                logOperation(`Peer failed PoA validation: ${peer}`);
            }
        } catch (error) {
            logError(`Error validating peer: ${peer}`, error.message);
        }
    }
    return validPeers;
}

/**
 * Send data to a specific peer with PoA validation and retries on failure.
 * @param {string} peerAddress - The address of the peer.
 * @param {Object} payload - The data to send.
 * @returns {Promise<Object>} - The response from the peer.
 */
async function sendDataToPeer(peerAddress, payload) {
    for (let attempt = 1; attempt <= PEER_MANAGER_CONFIG.retryOnFailure; attempt++) {
        try {
            logOperation(`Sending data to peer: ${peerAddress} (Attempt ${attempt})`);

            // Validate PoA before sending data
            const isValid = await validatePoA(peerAddress);
            if (!isValid) {
                throw new Error(`Peer failed PoA validation: ${peerAddress}`);
            }

            const response = await sendToPeer(peerAddress, payload);
            logOperation(`Response received from peer: ${peerAddress}`, response);
            return response;
        } catch (error) {
            logError(`Error sending data to peer ${peerAddress} (Attempt ${attempt}):`, error.message);
            if (attempt === PEER_MANAGER_CONFIG.retryOnFailure) {
                throw error;
            }
        }
    }
}

/**
 * Broadcast data to all active peers with PoA validation.
 * @param {Object} payload - The data to broadcast.
 * @returns {Promise<void>}
 */
async function broadcastData(payload) {
    logOperation("Broadcasting data to all active peers...");
    try {
        for (const peer of activePeers) {
            const isValid = await validatePoA(peer);
            if (!isValid) {
                logOperation(`Skipping peer due to failed PoA validation: ${peer}`);
                continue;
            }
            await sendToPeer(peer, payload);
        }
        logOperation("Data broadcasted successfully.");
    } catch (error) {
        logError("Error broadcasting data to peers:", error.message);
        throw error;
    }
}

/**
 * Retrieve metadata of discovered peers.
 * @returns {Array<Object>} - List of discovered peers with metadata.
 */
function getPeerMetadata() {
    try {
        return getDiscoveredPeers();
    } catch (error) {
        logError("Error retrieving peer metadata.", error.message);
        return [];
    }
}

/**
 * Dynamically add a new peer to the active peer list with PoA validation.
 * @param {string} peerAddress - The address of the peer to add.
 */
async function addPeer(peerAddress) {
    try {
        const isValid = await validatePoA(peerAddress);
        if (!isValid) {
            throw new Error(`Peer failed PoA validation: ${peerAddress}`);
        }
        if (!activePeers.includes(peerAddress)) {
            activePeers.push(peerAddress);
            logOperation(`Peer added dynamically: ${peerAddress}`);
        }
    } catch (error) {
        logError(`Error adding peer: ${peerAddress}`, error.message);
    }
}

/**
 * Dynamically remove a peer from the active peer list.
 * @param {string} peerAddress - The address of the peer to remove.
 */
function removePeer(peerAddress) {
    activePeers = activePeers.filter((peer) => peer !== peerAddress);
    logOperation(`Peer removed dynamically: ${peerAddress}`);
}

module.exports = {
    initializePeerManager,
    sendDataToPeer,
    broadcastData,
    getPeerMetadata,
    addPeer,
    removePeer,
};
