# supernodeManager.js

- Path: `C:\ATOMIC-SecureStorage\ATOMIC 2.0\atomic-blockchain\network\supernodeManager.js`
- Size: 4485 bytes
- Last Modified: Thu Nov 28 16:06:38 2024

```
"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: Supernode Manager
 *
 * Description:
 * Manages initialization and orchestration of supernodes within the ATOMIC blockchain.
 * Supports the setup, validation, and lifecycle management of supernodes for HQNode,
 * CorporateHQNode, and NationalDefenseHQNode networks, aligned with atomic unit structures.
 *
 * Dependencies:
 * - fs-extra: For file system operations.
 * - path: For directory and file path resolution.
 * - loggingUtils: For structured logging.
 * - validationUtils: For validating supernode configurations.
 * - blockchainApi: For interaction with the ATOMIC blockchain.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const { getLogger } = require("../../Utilities/Logging/loggingUtils");
const { validateSupernodeConfig, validateAtomicPaths } = require("../../Validation/validationUtils");
const { synchronizeAtomicData, fetchAtomicConfig } = require("../../api/blockchainApi");

const logger = getLogger();

// Constants
const SUPERNODE_CONFIG_PATH = path.resolve(__dirname, "../../config/supernodes");

/**
 * Initializes supernodes for the specified node type and configuration.
 * @param {Object} supernodeConfig - Configuration for the supernodes.
 * @param {string} dataPath - Path to the data directory for this node.
 */
async function initializeSupernode(supernodeConfig, dataPath) {
    logger.info("Initializing supernode...");

    // Validate supernode configuration
    if (!validateSupernodeConfig(supernodeConfig)) {
        logger.error("Supernode configuration validation failed.");
        throw new Error("Invalid supernode configuration.");
    }

    // Ensure data directory exists
    const supernodeDataPath = path.join(dataPath, "supernode");
    await fs.ensureDir(supernodeDataPath);
    logger.info(\`Supernode data directory ensured: ${supernodeDataPath}\`);

    // Initialize atomic paths for neutrons, protons, and electrons
    const atomicPaths = {
        neutrons: path.join(supernodeDataPath, "neutrons"),
        protons: path.join(supernodeDataPath, "protons"),
        electrons: path.join(supernodeDataPath, "electrons"),
    };

    // Validate atomic paths
    if (!validateAtomicPaths(atomicPaths)) {
        logger.error("Atomic paths validation failed.");
        throw new Error("Invalid atomic paths configuration.");
    }

    // Synchronize atomic data from blockchain
    await synchronizeAtomicData(atomicPaths);

    // Initialize each supernode in the configuration
    for (const node of supernodeConfig.nodes) {
        logger.info(\`Setting up supernode: ${node.id}\`);
        const nodePath = path.join(supernodeDataPath, node.id);

        try {
            await setupSupernode(node, nodePath, atomicPaths);
            logger.info(\`Supernode ${node.id} initialized successfully.\`);
        } catch (error) {
            logger.error(\`Failed to initialize supernode ${node.id}: ${error.message}\`);
        }
    }

    logger.info("Supernode initialization completed.");
}

/**
 * Sets up an individual supernode.
 * @param {Object} node - Supernode configuration.
 * @param {string} nodePath - Directory path for the supernode.
 * @param {Object} atomicPaths - Paths for atomic data (neutrons, protons, electrons).
 */
async function setupSupernode(node, nodePath, atomicPaths) {
    // Create the supernode directory
    await fs.ensureDir(nodePath);
    logger.info(\`Supernode directory created: ${nodePath}\`);

    // Fetch and apply atomic configurations for the supernode
    const atomicConfig = await fetchAtomicConfig(node.id);
    if (atomicConfig) {
        node.atomicConfig = atomicConfig;
    } else {
        logger.warn(\`No atomic configuration found for supernode ${node.id}\`);
    }

    // Save the node's configuration to a file
    const configPath = path.join(nodePath, "config.json");
    await fs.writeJson(configPath, { ...node, atomicPaths }, { spaces: 2 });
    logger.info(\`Configuration saved for supernode ${node.id}\`);
}

module.exports = {
    initializeSupernode,
};
```

