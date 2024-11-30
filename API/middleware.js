"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ---------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: Middleware
 *
 * Description:
 * Provides middleware for the ATOMIC API, including security, request logging,
 * rate limiting, and compatibility with ATOMIC's quantum-inspired decentralized
 * architecture.
 *
 * Features:
 * - Authentication and authorization for secure access.
 * - Rate limiting to prevent abuse.
 * - Request logging with quantum-inspired metadata.
 * - Error handling and response standardization.
 *
 * Author: Shawn Blackmore
 * ---------------------------------------------------------------------------
 */

const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const cors = require("cors");
const { verifyToken } = require("./utils");

// Configurable rate limiting settings
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: "Too many requests from this IP, please try again later.",
    },
});

// Default CORS options
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = [
            "http://localhost:3000",
            "https://your-production-domain.com",
        ];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Authorization", "Content-Type"],
};

// Middleware to add quantum-inspired request metadata
function quantumRequestMetadata(req, res, next) {
    req.metadata = {
        requestId: generateQuantumId(),
        timestamp: new Date().toISOString(),
        client: req.ip,
    };
    console.log(`[Request Metadata] ${JSON.stringify(req.metadata)}`);
    next();
}

// Generate a quantum-inspired unique identifier
function generateQuantumId() {
    const baseTime = Date.now();
    const randomFactor = Math.random().toString(36).substring(2, 15);
    return `${baseTime}-${randomFactor}`;
}

// Authentication middleware for API token validation
function authenticate(req, res, next) {
    const token = req.headers["authorization"];
    if (!token || !token.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: Missing or invalid token.",
        });
    }

    const apiToken = token.split(" ")[1];
    if (!verifyToken(apiToken)) {
        return res.status(403).json({
            success: false,
            message: "Forbidden: Invalid API token.",
        });
    }

    next();
}

// Custom error-handling middleware
function errorHandler(err, req, res, next) {
    console.error(`[Error] ${err.message}`);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
}

module.exports = {
    rateLimiter: limiter,
    corsMiddleware: cors(corsOptions),
    helmetMiddleware: helmet(),
    quantumRequestMetadata,
    authenticate,
    errorHandler,
};