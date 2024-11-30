"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ---------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: API Index
 *
 * Description:
 * Entry point for the ATOMIC API module. Centralizes initialization of the
 * API server and exposes essential functionalities for integration with
 * other components of the ATOMIC system.
 *
 * Author: Shawn Blackmore
 * ---------------------------------------------------------------------------
 */

const express = require("express");
const app = express();
const routes = require("./routes");
const {
    helmetMiddleware,
    corsMiddleware,
    rateLimiter,
    quantumRequestMetadata,
    errorHandler,
} = require("./middleware");

// Load environment variables
require("dotenv").config();

// Configuration
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(express.json());
app.use(rateLimiter);
app.use(quantumRequestMetadata);

// Routes
app.use("/api", routes);

// Root-level health check
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to the ATOMIC API",
        timestamp: new Date().toISOString(),
    });
});

// Error handling
app.use(errorHandler);

// Start the server
function startServer() {
    app.listen(PORT, () => {
        console.log(`ATOMIC API server is running on port ${PORT}`);
    });
}

// Export the app and startServer for external integration
module.exports = { app, startServer };

// Start server if this file is executed directly
if (require.main === module) {
    startServer();
}
