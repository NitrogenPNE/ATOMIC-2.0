"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ---------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: Node Controller
 *
 * Description:
 * Provides endpoints for managing and monitoring ATOMIC nodes and supernodes,
 * including status checks, restarts, and synchronization.
 *
 * Features:
 * - Retrieve the status of individual nodes or supernodes.
 * - Restart specific nodes or supernodes.
 * - Synchronize all nodes and supernodes in the network.
 * - Extendable for future node or supernode management features.
 *
 * Author: Shawn Blackmore
 * ---------------------------------------------------------------------------
 */

const axios = require("axios");

// Node and supernode endpoints
const nodeEndpoints = [
    "http://localhost:4001",
    "http://localhost:4002",
    "http://localhost:4003",
];

const supernodeEndpoints = [
    "http://localhost:5001",
    "http://localhost:5002",
];

/**
 * Retrieve the status of a specific node or supernode.
 * @param {string} id - ID of the node or supernode.
 * @param {string[]} endpoints - Array of node or supernode endpoints.
 * @returns {Object} - Status of the requested node or supernode.
 */
async function getStatus(id, endpoints) {
    const endpoint = endpoints.find((url) => url.includes(id));
    if (!endpoint) {
        throw new Error(`Endpoint with ID ${id} not found.`);
    }
    const response = await axios.get(`${endpoint}/status`);
    return response.data;
}

/**
 * Restart a specific node or supernode.
 * @param {string} id - ID of the node or supernode.
 * @param {string[]} endpoints - Array of node or supernode endpoints.
 */
async function restart(id, endpoints) {
    const endpoint = endpoints.find((url) => url.includes(id));
    if (!endpoint) {
        throw new Error(`Endpoint with ID ${id} not found.`);
    }
    await axios.post(`${endpoint}/restart`);
}

/**
 * Retrieve the status of a specific node.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
async function getNodeStatus(req, res) {
    try {
        const { nodeId } = req.params;
        const status = await getStatus(nodeId, nodeEndpoints);
        res.status(200).json({ success: true, data: status });
    } catch (error) {
        console.error(`Error in getNodeStatus: ${error.message}`);
        res.status(404).json({ success: false, message: error.message });
    }
}

/**
 * Retrieve the status of a specific supernode.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
async function getSupernodeStatus(req, res) {
    try {
        const { supernodeId } = req.params;
        const status = await getStatus(supernodeId, supernodeEndpoints);
        res.status(200).json({ success: true, data: status });
    } catch (error) {
        console.error(`Error in getSupernodeStatus: ${error.message}`);
        res.status(404).json({ success: false, message: error.message });
    }
}

/**
 * Restart a specific node.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
async function restartNode(req, res) {
    try {
        const { nodeId } = req.params;
        await restart(nodeId, nodeEndpoints);
        res.status(200).json({ success: true, message: `Node ${nodeId} restarted successfully.` });
    } catch (error) {
        console.error(`Error in restartNode: ${error.message}`);
        res.status(404).json({ success: false, message: error.message });
    }
}

/**
 * Restart a specific supernode.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
async function restartSupernode(req, res) {
    try {
        const { supernodeId } = req.params;
        await restart(supernodeId, supernodeEndpoints);
        res.status(200).json({ success: true, message: `Supernode ${supernodeId} restarted successfully.` });
    } catch (error) {
        console.error(`Error in restartSupernode: ${error.message}`);
        res.status(404).json({ success: false, message: error.message });
    }
}

/**
 * Synchronize all nodes and supernodes in the network.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
async function synchronizeAll(req, res) {
    const allEndpoints = [...nodeEndpoints, ...supernodeEndpoints];
    const syncResults = await Promise.all(
        allEndpoints.map(async (endpoint) => {
            try {
                const response = await axios.post(`${endpoint}/synchronize`);
                return { endpoint, status: "synchronized", details: response.data };
            } catch (error) {
                return { endpoint, status: "failed", error: error.message };
            }
        })
    );

    res.status(200).json({ success: true, results: syncResults });
}

module.exports = {
    getNodeStatus,
    getSupernodeStatus,
    restartNode,
    restartSupernode,
    synchronizeAll,
};
