"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ---------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: Health Controller
 *
 * Description:
 * Provides endpoints for system health checks, including API health, node
 * connectivity, and service status.
 *
 * Author: Shawn Blackmore
 * ---------------------------------------------------------------------------
 */

const axios = require("axios");

/**
 * Perform a basic health check for the API server.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
function checkApiHealth(req, res) {
    res.status(200).json({
        success: true,
        message: "API is running and healthy.",
        timestamp: new Date().toISOString(),
    });
}

/**
 * Check the status of nodes in the ATOMIC network.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
async function checkNodeHealth(req, res) {
    const nodeEndpoints = [
        "http://localhost:4001",
        "http://localhost:4002",
        "http://localhost:4003",
    ];

    const nodeStatuses = await Promise.all(
        nodeEndpoints.map(async (endpoint) => {
            try {
                const response = await axios.get(`${endpoint}/health`);
                return {
                    endpoint,
                    status: "healthy",
                    details: response.data,
                };
            } catch (error) {
                return {
                    endpoint,
                    status: "unhealthy",
                    error: error.message,
                };
            }
        })
    );

    res.status(200).json({
        success: true,
        nodes: nodeStatuses,
    });
}

/**
 * Perform a full system diagnostic, checking API and nodes.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
async function performFullDiagnostics(req, res) {
    try {
        const apiHealth = {
            service: "API",
            status: "healthy",
            timestamp: new Date().toISOString(),
        };

        const nodeEndpoints = [
            "http://localhost:4001",
            "http://localhost:4002",
            "http://localhost:4003",
        ];

        const nodeStatuses = await Promise.all(
            nodeEndpoints.map(async (endpoint) => {
                try {
                    const response = await axios.get(`${endpoint}/health`);
                    return {
                        service: `Node (${endpoint})`,
                        status: "healthy",
                        details: response.data,
                    };
                } catch (error) {
                    return {
                        service: `Node (${endpoint})`,
                        status: "unhealthy",
                        error: error.message,
                    };
                }
            })
        );

        res.status(200).json({
            success: true,
            diagnostics: [apiHealth, ...nodeStatuses],
        });
    } catch (error) {
        console.error("Error in performFullDiagnostics:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to perform system diagnostics.",
        });
    }
}

module.exports = {
    checkApiHealth,
    checkNodeHealth,
    performFullDiagnostics,
};
