"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ---------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: API Server
 *
 * Description:
 * Main entry point for the ATOMIC API server. Configures middleware, loads
 * routes, and starts the server with quantum-inspired decentralized features.
 *
 * Author: Shawn Blackmore
 * ---------------------------------------------------------------------------
 */

const express = require("express");
const { helmetMiddleware, corsMiddleware, errorHandler, rateLimiter, quantumRequestMetadata } = require("./middleware");
const routes = require("./routes");

const app = express();

// Load configuration
const PORT = process.env.PORT || 8080;
const ENV = process.env.NODE_ENV || "development";

// Middleware setup
app.use(helmetMiddleware); // Security headers
app.use(corsMiddleware); // Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies
app.use(rateLimiter); // Rate limiting
app.use(quantumRequestMetadata); // Add quantum-inspired metadata to requests

// Load routes
app.use("/api", routes);

// Health check endpoint (root-level for easy monitoring)
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "ATOMIC API is operational.",
        timestamp: new Date().toISOString(),
    });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`ATOMIC API server is running in ${ENV} mode on port ${PORT}`);
});