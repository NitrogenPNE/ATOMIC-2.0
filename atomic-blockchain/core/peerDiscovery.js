"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Enhanced Peer Discovery
//
// Description:
// Implements dynamic peer discovery, token-based validation, and secure authentication
// with atomic-level metadata for ATOMIC’s military-grade network.
//
// Enhancements:
// - Token-based peer validation for Proof-of-Access.
// - Quantum-resistant peer validation using Kyber/Dilithium.
// - Shard-based peer capability verification with atomic metadata.
// - Role-based prioritization for HQ, Corporate, and Branch Nodes.
//
// ------------------------------------------------------------------------------

const dns = require("dns");
const winston = require("winston");
const { validatePeer, validateShardCapability } = require("../utils/validationUtils");
const { establishQuantumSecureConnection } = require("../utils/quantumCryptoUtils");
const { validateToken } = require("../../Pricing/TokenManagement/tokenValidation");

// **Logger Setup**
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: "peer-discovery-error.log", level: "error" }),
        new winston.transports.File({ filename: "peer-discovery.log" }),
    ],
});

// **Peer Discovery Configuration**
const PEER_DISCOVERY_CONFIG = {
    dnsSeed: process.env.DNS_SEED || "nodes.atomic.network",
    maxPeers: process.env.MAX_PEERS || 50,
    validationTimeout: 5000, // Timeout for peer validation in ms
    fallbackPeers: [
        { address: "ws://node1.atomic.network:6000", priority: 1 },
        { address: "ws://node2.atomic.network:6000", priority: 2 },
        { address: "ws://node3.atomic.network:6000", priority: 3 },
    ], // Hardcoded fallback nodes with priorities
};

// **Discovered Peers**
const discoveredPeers = new Map();

/**
 * Discover peers using DNS-based seeding.
 * @returns {Promise<Array<string>>} - List of discovered peer addresses.
 */
async function discoverPeers() {
    logger.info("Starting peer discovery...");

    try {
        // Perform DNS lookup
        const peers = await resolveDNS(PEER_DISCOVERY_CONFIG.dnsSeed);

        // Validate discovered peers
        const validPeers = await validatePeers(peers);
        validPeers.forEach((peer) =>
            discoveredPeers.set(peer, { role: "Generic", atomicCapabilities: null, lastChecked: Date.now() })
        );

        logger.info(`Discovered ${validPeers.length} valid peers.`);
        return Array.from(discoveredPeers.keys());
    } catch (error) {
        logger.error("Error during peer discovery:", error);

        // Use fallback peers if discovery fails
        logger.warn("Using fallback peers...");
        PEER_DISCOVERY_CONFIG.fallbackPeers.forEach(({ address }) =>
            discoveredPeers.set(address, { role: "Fallback", atomicCapabilities: null, lastChecked: Date.now() })
        );
        return Array.from(discoveredPeers.keys());
    }
}

/**
 * Resolve DNS seed to discover peer addresses.
 * @param {string} dnsSeed - DNS seed hostname.
 * @returns {Promise<Array<string>>} - List of resolved peer addresses.
 */
function resolveDNS(dnsSeed) {
    return new Promise((resolve, reject) => {
        dns.resolve(dnsSeed, "A", (error, addresses) => {
            if (error) {
                return reject(error);
            }

            // Convert IPs to WebSocket URLs
            const peers = addresses.map((ip) => `ws://${ip}:6000`);
            resolve(peers);
        });
    });
}

/**
 * Validate a list of peers for compliance with ATOMIC standards.
 * @param {Array<string>} peers - List of peer addresses.
 * @returns {Promise<Array<string>>} - List of valid peers.
 */
async function validatePeers(peers) {
    logger.info("Validating discovered peers...");
    const validPeers = [];

    for (const peer of peers) {
        try {
            const isQuantumSecure = await establishQuantumSecureConnection(peer); // Ensure quantum security
            const shardCapable = await validateShardCapability(peer, ["protons", "neutrons", "electrons"]); // Atomic validation
            const hasValidToken = await validateTokenForPeer(peer); // Token-based Proof-of-Access validation

            const isValid = isQuantumSecure && shardCapable && hasValidToken &&
                (await validatePeer(peer, PEER_DISCOVERY_CONFIG.validationTimeout));

            if (isValid) {
                validPeers.push(peer);
            } else {
                logger.warn(`Invalid or non-compliant peer detected and skipped: ${peer}`);
            }
        } catch (error) {
            logger.warn(`Error validating peer ${peer}:`, error.message);
        }
    }

    return validPeers;
}

/**
 * Validate the token associated with a peer for Proof-of-Access.
 * @param {string} peer - Peer address.
 * @returns {Promise<boolean>} - True if the token is valid, false otherwise.
 */
async function validateTokenForPeer(peer) {
    try {
        logger.info(`Validating token for peer: ${peer}`);
        const tokenId = await getTokenIdFromPeer(peer); // Fetch token ID associated with the peer
        const encryptedToken = await getEncryptedTokenFromPeer(peer); // Fetch encrypted token
        const validation = await validateToken(tokenId, encryptedToken);
        return validation.valid;
    } catch (error) {
        logger.warn(`Token validation failed for peer ${peer}:`, error.message);
        return false;
    }
}

/**
 * Add a new peer to the discovered set manually.
 * @param {string} peerAddress - Address of the peer to add.
 * @param {string} role - Role of the node (e.g., HQ, Corporate, Branch).
 * @param {Object} atomicCapabilities - Atomic metadata capabilities of the peer.
 * @returns {boolean} - True if the peer was added, false if it already exists.
 */
function addPeerManually(peerAddress, role = "Generic", atomicCapabilities = { protons: true, neutrons: true, electrons: true }) {
    if (discoveredPeers.has(peerAddress)) {
        logger.warn(`Peer ${peerAddress} is already in the network.`);
        return false;
    }

    discoveredPeers.set(peerAddress, { role, atomicCapabilities, lastChecked: Date.now() });
    logger.info(`Peer ${peerAddress} added manually as role: ${role} with capabilities:`, atomicCapabilities);
    return true;
}

/**
 * Remove a peer from the network.
 * @param {string} peerAddress - Address of the peer to remove.
 */
function removePeer(peerAddress) {
    if (discoveredPeers.delete(peerAddress)) {
        logger.info(`Peer ${peerAddress} removed from the network.`);
    } else {
        logger.warn(`Attempted to remove unknown peer: ${peerAddress}`);
    }
}

/**
 * Get the current list of discovered peers.
 * @returns {Array<Object>} - List of peer addresses with metadata.
 */
function getDiscoveredPeers() {
    return Array.from(discoveredPeers.entries()).map(([address, metadata]) => ({
        address,
        ...metadata,
    }));
}

module.exports = {
    discoverPeers,
    addPeerManually,
    removePeer,
    getDiscoveredPeers,
};
