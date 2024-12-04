"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Military-Grade Enhanced Peer Discovery for GOVMintHQNode
//
// Description:
// Implements secure peer discovery with token-based Proof-of-Access, 
// quantum-resistant encryption, and peer prioritization.
//
// ------------------------------------------------------------------------------

const dns = require("dns");
const winston = require("winston");
const { validatePeer, validateShardCapability } = require("../Utilities/validationUtils");
const { establishQuantumSecureConnection } = require("../Utilities/quantumCryptoUtils");
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
    dnsSeed: process.env.DNS_SEED || "nodes.atomic.gov",
    maxPeers: process.env.MAX_PEERS || 100,
    validationTimeout: 5000, // Timeout for peer validation in ms
    fallbackPeers: [
        { address: "ws://hq.supernode.gov:7000", role: "HQPeer", priority: 1 }, // Prioritize HQPeers
        { address: "ws://secondary.node.gov:7001", role: "SecondaryPeer", priority: 0 },
    ], // Fallback peers for GOVMintHQNode
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
            discoveredPeers.set(peer.address, {
                role: peer.role || "Generic",
                atomicCapabilities: peer.atomicCapabilities || null,
                priority: peer.priority || 0,
                lastChecked: Date.now(),
            })
        );

        logger.info(`Discovered ${validPeers.length} valid peers.`);
        return prioritizePeers();
    } catch (error) {
        logger.error("Error during peer discovery:", error);

        // Use fallback peers if discovery fails
        logger.warn("Using fallback peers...");
        PEER_DISCOVERY_CONFIG.fallbackPeers.forEach(({ address, role, priority }) =>
            discoveredPeers.set(address, { role, atomicCapabilities: null, priority, lastChecked: Date.now() })
        );
        return prioritizePeers();
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
 * @returns {Promise<Array<Object>>} - List of valid peers with metadata.
 */
async function validatePeers(peers) {
    logger.info("Validating discovered peers...");
    const validPeers = [];

    for (const peer of peers) {
        try {
            const isQuantumSecure = await establishQuantumSecureConnection(peer);
            const shardCapable = await validateShardCapability(peer, ["protons", "neutrons", "electrons"]);
            const hasValidToken = await validateTokenForPeer(peer);

            if (isQuantumSecure && shardCapable && hasValidToken) {
                // Assign role and priority dynamically (e.g., HQPeer > SecondaryPeer > Generic)
                const role = assignPeerRole(peer);
                const priority = role === "HQPeer" ? 1 : 0;
                validPeers.push({ address: peer, role, priority });
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
        const tokenId = await getTokenIdFromPeer(peer);
        const encryptedToken = await getEncryptedTokenFromPeer(peer);
        const validation = await validateToken(tokenId, encryptedToken);
        return validation.valid;
    } catch (error) {
        logger.warn(`Token validation failed for peer ${peer}:`, error.message);
        return false;
    }
}

/**
 * Assign a role to a peer based on metadata or fallback defaults.
 * @param {string} peer - Peer address.
 * @returns {string} - Assigned role (e.g., HQPeer, SecondaryPeer).
 */
function assignPeerRole(peer) {
    // Example role assignment logic
    if (peer.includes("hq")) return "HQPeer";
    return "SecondaryPeer";
}

/**
 * Prioritize peers based on their roles.
 * @returns {Array<Object>} - List of peers sorted by priority.
 */
function prioritizePeers() {
    return Array.from(discoveredPeers.entries())
        .map(([address, metadata]) => ({
            address,
            ...metadata,
        }))
        .sort((a, b) => b.priority - a.priority);
}

/**
 * Get the current list of discovered peers.
 * @returns {Array<Object>} - List of peer addresses with metadata.
 */
function getDiscoveredPeers() {
    return prioritizePeers();
}

module.exports = {
    discoverPeers,
    getDiscoveredPeers,
};
