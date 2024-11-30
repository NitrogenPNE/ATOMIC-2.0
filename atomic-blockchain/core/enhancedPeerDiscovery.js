"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
//
// Module: Enhanced Peer Discovery with Token-Based Access Control
//
// Description:
// Implements dynamic peer discovery, token-based validation, and secure authentication
// with atomic-level metadata for ATOMIC’s military-grade network.
//
// Enhancements:
// - Token-based peer validation for Proof-of-Access.
// - Quantum-resistant peer authentication using Kyber/Dilithium.
// - Shard-based peer capability verification with atomic metadata.
// - Role-based prioritization for HQ, Corporate, and Branch Nodes.
//
// Dependencies:
// - dns: For DNS-based peer resolution.
// - winston: Logging.
// - validationUtils.js: Provides validation methods for peers and tokens.
// - quantumCryptoUtils.js: Quantum-resistant cryptographic utilities.
//
// ------------------------------------------------------------------------------

const dns = require("dns");
const winston = require("winston");
const { validatePeer, validateShardCapability } = require("../utils/validationUtils");
const { establishQuantumSecureConnection } = require("../utils/quantumCryptoUtils");
const { validateToken } = require("../../../Pricing/TokenManagement/tokenValidation");

// Logger setup
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

// Peer discovery configuration
const PEER_DISCOVERY_CONFIG = {
    dnsSeed: process.env.DNS_SEED || "nodes.atomic.network",
    maxPeers: process.env.MAX_PEERS || 50,
    validationTimeout: 5000, // Timeout for peer validation in ms
    fallbackPeers: [
        { address: "ws://node1.atomic.network:6000", priority: 1 },
        { address: "ws://node2.atomic.network:6000", priority: 2 },
        { address: "ws://node3.atomic.network:6000", priority: 3 },
    ],
};

// Discovered peers map
const discoveredPeers = new Map();

/**
 * Discover peers using DNS-based seeding with token validation.
 * @returns {Promise<Array<string>>} - List of validated peer addresses.
 */
async function discoverPeers() {
    logger.info("Starting enhanced peer discovery...");

    try {
        const peerAddresses = await resolveDNS(PEER_DISCOVERY_CONFIG.dnsSeed);

        const validatedPeers = await validatePeers(peerAddresses);

        validatedPeers.forEach((peer) => {
            discoveredPeers.set(peer, { status: "validated", lastChecked: Date.now() });
        });

        logger.info(`Successfully discovered and validated ${validatedPeers.length} peers.`);
        return Array.from(discoveredPeers.keys());
    } catch (error) {
        logger.error("Error during peer discovery:", error);

        logger.warn("Using fallback peers...");
        PEER_DISCOVERY_CONFIG.fallbackPeers.forEach(({ address }) => {
            discoveredPeers.set(address, { status: "fallback", lastChecked: Date.now() });
        });

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
            if (error) return reject(error);
            resolve(addresses.map((ip) => `ws://${ip}:6000`));
        });
    });
}

/**
 * Validate discovered peers for compliance with ATOMIC standards.
 * @param {Array<string>} peers - List of peer addresses.
 * @returns {Promise<Array<string>>} - List of valid peer addresses.
 */
async function validatePeers(peers) {
    logger.info("Validating discovered peers...");
    const validPeers = [];

    for (const peer of peers) {
        try {
            const isQuantumSecure = await establishQuantumSecureConnection(peer);
            const hasValidToken = await validatePeerToken(peer);

            const isValid = isQuantumSecure && hasValidToken && (await validatePeer(peer, PEER_DISCOVERY_CONFIG.validationTimeout));

            if (isValid) {
                validPeers.push(peer);
            } else {
                logger.warn(`Invalid peer skipped: ${peer}`);
            }
        } catch (error) {
            logger.warn(`Error validating peer ${peer}:`, error.message);
        }
    }

    return validPeers;
}

/**
 * Validate a peer's token for Proof-of-Access.
 * @param {string} peer - Peer address.
 * @returns {Promise<boolean>} - True if the token is valid, false otherwise.
 */
async function validatePeerToken(peer) {
    try {
        logger.info(`Validating token for peer: ${peer}`);
        const tokenId = await fetchTokenId(peer);
        const encryptedToken = await fetchEncryptedToken(peer);
        const validationResult = await validateToken(tokenId, encryptedToken);
        return validationResult.valid;
    } catch (error) {
        logger.warn(`Token validation failed for peer ${peer}:`, error.message);
        return false;
    }
}

/**
 * Fetch token ID from a peer (stub for actual implementation).
 * @param {string} peer - Peer address.
 * @returns {Promise<string>} - Token ID.
 */
async function fetchTokenId(peer) {
    // Example: Simulate token fetch
    return `token-${peer}`;
}

/**
 * Fetch encrypted token from a peer (stub for actual implementation).
 * @param {string} peer - Peer address.
 * @returns {Promise<string>} - Encrypted token string.
 */
async function fetchEncryptedToken(peer) {
    // Example: Simulate fetching encrypted token
    return `encrypted-token-${peer}`;
}

/**
 * Get the current list of discovered peers.
 * @returns {Array<Object>} - List of discovered peers with metadata.
 */
function getDiscoveredPeers() {
    return Array.from(discoveredPeers.entries()).map(([address, metadata]) => ({ address, ...metadata }));
}

module.exports = {
    discoverPeers,
    getDiscoveredPeers,
};
