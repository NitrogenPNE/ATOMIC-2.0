"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * GOVMintHQNode - Main Entry Point
 *
 * Description:
 * Entry point for the GOVMintHQNode, managing initialization, integration with
 * the ATOMIC blockchain, and facilitating node operations.
 *
 * Author: GOVMintHQNode Integration Team
 * ------------------------------------------------------------------------------
 */

const path = require("path");
const { initializePeerManager } = require("./Blockchain/peerManager");
const { executeGOVMintConsensus } = require("./Blockchain/consensus");
const { mintCurrency } = require("./CryptoMinting/mintCurrency");
const { validateShard } = require("../Core/Sharding/shardValidator");
const { startMonitoring } = require("./Governance/monitoringService");
const { registerNode, validateNodeToken } = require("./Governance/nodeManagerWithPoA");
const { logOperation, logError, sendAlert } = require("./Utilities/loggingUtils");
const config = require("./Config/NodeConfig.json");
const { getSecureConfig } = require("./Utilities/secureConfig");

// Modular initialization
async function initializeNode() {
    try {
        console.log(`Initializing ${config.NodeDetails.NodeType} (${config.NodeDetails.NodeID})...`);
        logOperation("Node initialization started", { nodeID: config.NodeDetails.NodeID });

        // Securely fetch API keys and credentials
        const secureConfig = await getSecureConfig();
        if (!secureConfig.apiKeys || !secureConfig.apiKeys.currencyExchange) {
            throw new Error("Missing API keys in secure configuration.");
        }

        console.log("Secure configuration loaded successfully.");

        // Step 1: Register essential nodes
        await registerEssentialNodes();

        // Step 2: Initialize Peer Manager
        console.log("Initializing Peer Manager...");
        await initializePeerManager();

        // Step 3: Start Monitoring Services
        console.log("Starting monitoring services...");
        await startMonitoring(config.PerformanceMonitoring.MonitoringModule);

        console.log("Node initialized successfully.");
        logOperation("Node initialization complete", { nodeID: config.NodeDetails.NodeID });
    } catch (error) {
        console.error("Node initialization failed:", error.message);
        logError("Node initialization failed", { error: error.message });
        process.exit(1);
    }
}

// Register essential nodes
async function registerEssentialNodes() {
    const essentialNodes = [
        { name: "govmint-minting-node.internal", type: "MintingNode", roles: ["MintCurrency", "AuditMinting"] },
        { name: "govmint-validation-node.internal", type: "ValidationNode", roles: ["ValidateTransactions", "ValidateShards"] },
    ];

    for (const node of essentialNodes) {
        console.log(`Registering node: ${node.name}...`);
        await registerNode(node);
        logOperation("Node registered", { node });
    }

    const tokenValidationResult = await validateNodeToken(
        "node://govmint-validation-node.internal",
        "exampleTokenForValidation"
    );
    console.log(`Token validation result for govmint-validation-node: ${tokenValidationResult}`);
}

// Consensus process
async function processConsensus() {
    try {
        console.log("Starting consensus process...");
        const blockchain = [];
        const peers = [];

        const proofOfAccess = {
            tokenId: "exampleTokenId",
            encryptedToken: "exampleEncryptedToken",
        };

        const consensusResult = await executeGOVMintConsensus(blockchain, peers, proofOfAccess);
        if (consensusResult.success) {
            console.log("Consensus achieved:", consensusResult.details);
            logOperation("Consensus achieved", consensusResult);
        } else {
            console.error("Consensus failed:", consensusResult.message);
            logError("Consensus failure", { message: consensusResult.message });
        }
    } catch (error) {
        console.error("Error during consensus process:", error.message);
        logError("Consensus process error", { error: error.message });
    }
}

// Mint currency and validate shards
async function mintAndValidateCurrency() {
    try {
        console.log("Minting currency...");
        const mintResult = await mintCurrency("USD", 1000);
        console.log("Minting result:", mintResult);
        logOperation("Currency minted", { currency: "USD", amount: 1000 });

        console.log("Validating shard...");
        const isShardValid = await validateShard("proton", "exampleShardAddress");
        console.log("Shard validation result:", isShardValid);
        logOperation("Shard validated", { shardType: "proton", shardAddress: "exampleShardAddress", isValid: isShardValid });
    } catch (error) {
        console.error("Error during minting/validation process:", error.message);
        logError("Minting/validation error", { error: error.message });

        // Send alert for failure
        sendAlert({
            title: "Minting/Validation Error",
            details: error.message,
            severity: "High",
        });
    }
}

// Main execution
(async () => {
    await initializeNode();

    // Periodic tasks
    setInterval(processConsensus, config.NetworkSettings.Consensus.ValidationTimeoutSeconds * 1000);
    setInterval(mintAndValidateCurrency, 60000);
})();
