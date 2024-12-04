# index.js

- Path: `C:\ATOMIC-SecureStorage\ATOMIC 2.0\atomic-blockchain\index.js`
- Size: 4329 bytes
- Last Modified: Thu Nov 28 16:20:53 2024

```
"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All rights reserved.
 *
 * Module: Blockchain Initialization and Main Entry Point
 *
 * Description:
 * Bootstraps the ATOMIC blockchain system by initializing nodes, supernodes,
 * sharding policies, and security protocols. Dynamically adapts based on
 * environment configurations and supports API integration for HQNodes.
 *
 * Enhancements:
 * - Incorporates atomic hierarchy (neutrons, protons, electrons) into sharding.
 * - Validates atomic-level configurations and security protocols.
 * - Ensures consistency in sharding and network initialization.
 *
 * Author: Shawn Blackmore
 * ------------------------------------------------------------------------------
 */

// Dependencies
const fs = require("fs-extra");
const path = require("path");
const { initializeSupernode, initializeNode } = require("../network/supernodeManager");
const { shardDataIntoAtoms } = require("../../Core/Sharding/bitSharder"); // Updated reference
const { initializeSecurity } = require("../../Security/Manager/securityManager");
const { startApiServer } = require("../../API/apiServer");
const { getLogger } = require("../../Utilities/Logging/loggingUtils");
const { validateGenesisBlock } = require("../../Validation/validationUtils");
const config = require("../config/config.json");

// Logger setup
const logger = getLogger();

// **Environment Configuration**
const ENV = process.env.NODE_ENV || "development";
const ENV_CONFIG = config.environment[ENV];
if (!ENV_CONFIG) {
    console.error(\`Invalid NODE_ENV: ${ENV}\`);
    process.exit(1);
}

// **Node-Specific Configuration**
const NODE_TYPE = process.env.NODE_TYPE || "HQNode"; // HQNode, CorporateHQNode, or NationalDefenseHQNode
const NODE_CONFIG = config.nodes[NODE_TYPE];
if (!NODE_CONFIG) {
    console.error(\`Invalid NODE_TYPE: ${NODE_TYPE}\`);
    process.exit(1);
}

// **Constants**
const DATA_PATH = path.resolve(__dirname, NODE_CONFIG.dataPath || ENV_CONFIG.dataPath);
const GENESIS_BLOCK = NODE_CONFIG.genesisBlock || config.blockchain.genesisBlock;

// **Initialization**
(async () => {
    try {
        logger.info(\`Starting ATOMIC Blockchain in '${ENV}' mode for ${NODE_TYPE}...\`);

        // Step 1: Initialize Data Directory
        logger.info("Initializing data directories...");
        await fs.ensureDir(DATA_PATH);

        // Step 2: Validate Genesis Block
        logger.info("Validating Genesis Block...");
        if (!validateGenesisBlock(GENESIS_BLOCK)) {
            throw new Error("Invalid Genesis Block configuration.");
        }

        // Step 3: Initialize Security (Encryption, Tamper Detection)
        logger.info("Initializing security protocols...");
        await initializeSecurity(NODE_CONFIG.security || config.security);

        // Step 4: Initialize Sharding
        logger.info("Setting up atomic-level sharding policies...");
        await shardDataIntoAtoms(
            NODE_TYPE,
            NODE_CONFIG.sharding || config.sharding,
            NODE_CONFIG.dataPath,
            { levels: ["neutron", "proton", "electron"] } // Add atomic levels
        );

        // Step 5: Initialize Network (Supernodes and Nodes)
        logger.info(\`Initializing ${NODE_TYPE} network nodes...\`);
        if (NODE_TYPE === "HQNode") {
            await initializeSupernode(NODE_CONFIG.supernodes, DATA_PATH);
        } else if (NODE_TYPE === "CorporateHQNode" || NODE_TYPE === "NationalDefenseHQNode") {
            await initializeNode(NODE_CONFIG.defaultNodePort, DATA_PATH);
        } else {
            throw new Error(\`Unsupported NODE_TYPE: ${NODE_TYPE}\`);
        }

        // Step 6: Start API Server (if enabled)
        if (NODE_CONFIG.api) {
            logger.info("Starting API Server...");
            await startApiServer(NODE_CONFIG.api);
        }

        logger.info(\`${NODE_TYPE} Blockchain Node is running.\`);
    } catch (error) {
        logger.error(\`Failed to start ${NODE_TYPE} Blockchain Node: ${error.message}\`);
        process.exit(1);
    }
})();
```

