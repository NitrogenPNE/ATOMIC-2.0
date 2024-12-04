"use strict"; // Enforce strict mode

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * -------------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 * All Rights Reserved.
 *
 * Version: 2.0.1
 * Module: Data Classifier with Node Integration and PoA Validation
 *
 * Description:
 * Transforms input data into atomic units (bits, bytes, KB, MB, GB, TB).
 * Includes sharding and node integration with PoA token validation.
 * Safeguards to reject unclassified or malformed data.
 *
 * Author: Shawn Blackmore
 * -------------------------------------------------------------------------------
 */

const fs = require("fs-extra");
const path = require("path");
const DataClassifierContract = require("../../../../SmartContracts/Data/dataClassifier/dataClassifierContract");
const { allocateShards } = require("../../../Sharding/shardAllocator");
const { shardDataIntoBits } = require("../../../Sharding/bitSharder");
const { communicateWithNode } = require("../../../../Utilities/shardNodeCommunicator");
const { validateToken } = require("../../../../Pricing/TokenManagement/tokenValidation");

// Constants for atom weights
const BIT_SIZE = 1;
const BYTE_SIZE = 8 * BIT_SIZE;
const KB_SIZE = 1024 * BYTE_SIZE;
const MB_SIZE = 1024 * KB_SIZE;
const GB_SIZE = 1024 * MB_SIZE;
const TB_SIZE = 1024 * GB_SIZE;

// Initialize the contract
const contract = new DataClassifierContract();

/**
 * Classifies input data into atomic units, validates PoA token, and assigns shards to nodes.
 * @param {Buffer | string | Object | Array} inputData - Data to classify.
 * @param {string} userId - ID of the user requesting classification.
 * @param {string} nodeId - ID of the node responsible for handling shards.
 * @param {string} tokenId - PoA token ID for validation.
 * @param {string} encryptedToken - Encrypted PoA token for validation.
 * @returns {Promise<Object>} - Classified and sharded atom structures.
 */
async function classifyData(inputData, userId, nodeId, tokenId, encryptedToken) {
    try {
        // Step 1: Validate PoA Token
        console.log(`Validating PoA token for User ID: ${userId}, Node ID: ${nodeId}...`);
        const tokenValidation = await validateToken(tokenId, encryptedToken);
        if (!tokenValidation.valid) {
            throw new Error("PoA token validation failed. Access denied.");
        }
        console.log("PoA token validated successfully.");

        // Step 2: Ensure data is in Buffer format
        const inputBuffer = await ensureBuffer(inputData);
        const totalBits = inputBuffer.length * 8;

        if (totalBits === 0) throw new Error("Input data is empty.");

        console.log(`Classifying ${inputBuffer.length} bytes (${totalBits} bits) for User ID: ${userId}, Node ID: ${nodeId}...`);

        // Step 3: Contract interaction for classification proposal
        const proposal = contract.createProposal(userId, "classification");

        // Step 4: Perform atomic classification
        const bitAtoms = createBitAtoms(totalBits);
        const byteAtoms = aggregateAtoms(bitAtoms, BYTE_SIZE);
        const kbAtoms = inputBuffer.length >= 1024 ? aggregateAtoms(byteAtoms, KB_SIZE) : [];
        const mbAtoms = inputBuffer.length >= MB_SIZE ? aggregateAtoms(kbAtoms, MB_SIZE) : [];
        const gbAtoms = inputBuffer.length >= GB_SIZE ? aggregateAtoms(mbAtoms, GB_SIZE) : [];
        const tbAtoms = inputBuffer.length >= TB_SIZE ? aggregateAtoms(gbAtoms, TB_SIZE) : [];

        const classifiedData = { bitAtoms, byteAtoms, kbAtoms, mbAtoms, gbAtoms, tbAtoms };

        // Step 5: Execute the proposal with classified data
        const result = await contract.executeProposal(proposal, classifiedData);
        console.log("Classification completed successfully.", result);

        // Step 6: Shard data and allocate to node
        const shardResult = await shardDataIntoBits(
            "HQNode",
            nodeId,
            inputBuffer.toString("base64"),
            tokenId,
            encryptedToken
        );
        console.log(`Sharding complete. Allocating shards to Node ID: ${nodeId}...`);
        await allocateShards(nodeId, tokenId, encryptedToken);

        // Step 7: Communicate with the node for shard placement
        await communicateWithNode(nodeId, {
            type: "allocateShards",
            payload: { shards: shardResult.bitAtoms },
        });

        console.log("Shards communicated to the node successfully.");
        return { result, shardResult };
    } catch (error) {
        console.error("Error classifying data:", error.message);
        throw error;
    }
}

/**
 * Converts input data to Buffer format.
 * Supports strings, objects, and files.
 */
async function ensureBuffer(input) {
    if (Buffer.isBuffer(input)) return input;

    if (typeof input === "string") {
        const isFilePath = path.isAbsolute(input) || input.includes(path.sep);
        if (isFilePath) {
            if (fs.existsSync(input)) {
                return await fs.readFile(input);
            } else {
                throw new Error(`File not found: ${input}`);
            }
        }
        if (input.trim() === "") throw new Error("Input string is empty.");
        return Buffer.from(input, "utf8");
    }

    if (typeof input === "object" || Array.isArray(input)) {
        try {
            return Buffer.from(JSON.stringify(input));
        } catch (error) {
            throw new Error("Failed to convert object/array to buffer.");
        }
    }

    throw new Error("Unsupported input type.");
}

/**
 * Creates bit-level atoms for the entire data.
 */
function createBitAtoms(totalBits) {
    return Array.from({ length: totalBits }, (_, index) => ({
        type: "bit",
        value: index % 2,
        id: `bit-${index}`,
    }));
}

/**
 * Aggregates smaller atoms into larger atomic units.
 */
function aggregateAtoms(atoms, limit) {
    const aggregated = [];
    let chunk = [];

    atoms.forEach((atom, index) => {
        chunk.push(atom);
        if (chunk.length === limit || index === atoms.length - 1) {
            aggregated.push(createAggregatedAtom(chunk, limit, aggregated.length));
            chunk = [];
        }
    });

    return aggregated;
}

/**
 * Creates an aggregated atom from a group of smaller atoms.
 */
function createAggregatedAtom(chunk, limit, index) {
    const atomType = getAtomTypeByLimit(limit);
    return {
        type: atomType,
        atoms: chunk,
        id: `${atomType}-${index}`,
    };
}

/**
 * Determines the atom type based on size limit.
 */
function getAtomTypeByLimit(limit) {
    switch (limit) {
        case BYTE_SIZE:
            return "byte";
        case KB_SIZE:
            return "KB";
        case MB_SIZE:
            return "MB";
        case GB_SIZE:
            return "GB";
        case TB_SIZE:
            return "TB";
        default:
            return "bit";
    }
}

module.exports = { classifyData };