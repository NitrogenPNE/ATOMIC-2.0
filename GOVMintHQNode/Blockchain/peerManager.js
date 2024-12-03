"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// GOVMintHQNode Peer Manager
//
// Description:
// Integrates the GOVMintHQNode with ATOMIC’s enhanced peer discovery and 
// network management modules.
//
// Dependencies:
// - enhancedPeerDiscovery.js: Advanced peer discovery module for ATOMIC blockchain.
// - networkManager.js: Manages peer-to-peer communication.
//
// Author: GOVMintHQNode Integration Team
// ------------------------------------------------------------------------------

const path = require("path");
const { discoverPeers, getDiscoveredPeers } = require(path.resolve(__dirname, "../../atomic-blockchain/core/enhancedPeerDiscovery.js"));
const { sendToPeer, receiveFromPeer, broadcastToPeers } = require(path.resolve(__dirname, "../../atomic-blockchain/core/networkManager.js"));

// Configuration for GOVMintHQNode peer management
const PEER_MANAGER_CONFIG = {
    maxPeers: process.env.MAX_PEERS || 50,
    discoveryInterval: 60000, // Discover peers every 60 seconds
};

// In-memory store for active peers
let activePeers = [];

/**
 * Initialize the GOVMintHQNode peer manager.
 * - Discovers peers using enhanced peer discovery.
 * - Starts periodic peer discovery.
 */
async function initializePeerManager() {
    console.log("Initializing GOVMintHQNode Peer Manager...");
    activePeers = await discoverPeers();
    console.log(`Active peers: ${activePeers.join(", ")}`);

    // Periodic peer discovery
    setInterval(async () => {
        console.log("Running periodic peer discovery...");
        activePeers = await discoverPeers();
        console.log(`Updated active peers: ${activePeers.join(", ")}`);
    }, PEER_MANAGER_CONFIG.discoveryInterval);
}

/**
 * Send data to a specific peer.
 * @param {string} peerAddress - The address of the peer.
 * @param {Object} payload - The data to send.
 * @returns {Promise<Object>} - The response from the peer.
 */
async function sendDataToPeer(peerAddress, payload) {
    console.log(`Sending data to peer: ${peerAddress}`);
    try {
        const response = await sendToPeer(peerAddress, payload);
        console.log(`Received response from peer: ${peerAddress}`, response);
        return response;
    } catch (error) {
        console.error(`Error sending data to peer ${peerAddress}:`, error);
        throw error;
    }
}

/**
 * Broadcast data to all active peers.
 * @param {Object} payload - The data to broadcast.
 * @returns {Promise<void>}
 */
async function broadcastData(payload) {
    console.log("Broadcasting data to all active peers...");
    try {
        await broadcastToPeers(payload, activePeers);
        console.log("Data broadcasted successfully.");
    } catch (error) {
        console.error("Error broadcasting data to peers:", error);
        throw error;
    }
}

/**
 * Retrieve metadata of discovered peers.
 * @returns {Array<Object>} - List of discovered peers with metadata.
 */
function getPeerMetadata() {
    return getDiscoveredPeers();
}

module.exports = {
    initializePeerManager,
    sendDataToPeer,
    broadcastData,
    getPeerMetadata,
};
