"use strict";

/**
 * SPDX-License-Identifier: ATOMIC-Limited-1.0
 * ---------------------------------------------------------------------------
 * ATOMIC (Advanced Technologies Optimizing Integrated Chains)
 * Copyright (c) 2023 ATOMIC, Ltd.
 *
 * Module: Routes
 *
 * Description:
 * Defines all API routes for managing nodes, supernodes, analytics, and system
 * health checks. Uses modular controllers for separation of concerns.
 *
 * Author: Shawn Blackmore
 * ---------------------------------------------------------------------------
 */

const express = require("express");
const router = express.Router();

// Import controllers
const nodeController = require("./controllers/nodeController");
const healthController = require("./controllers/healthController");
const analyticsController = require("./controllers/analyticsController");

// Import middleware
const { authenticate } = require("./middleware");

/**
 * Node Routes
 */
router.get("/nodes/:nodeId/status", authenticate, nodeController.getNodeStatus);
router.post("/nodes/:nodeId/restart", authenticate, nodeController.restartNode);

/**
 * Supernode Routes
 */
router.get("/supernodes/:supernodeId/status", authenticate, nodeController.getSupernodeStatus);
router.post("/supernodes/:supernodeId/restart", authenticate, nodeController.restartSupernode);

/**
 * Analytics Routes
 */
router.get("/analytics/network", authenticate, analyticsController.getNetworkMetrics);
router.get("/analytics/nodes", authenticate, analyticsController.getNodePerformance);
router.post("/analytics/report/:type", authenticate, analyticsController.generateReport);
router.post("/analytics/query", authenticate, analyticsController.processQuery);

/**
 * Health Routes
 */
router.get("/health", healthController.checkApiHealth);
router.get("/health/nodes", healthController.checkNodeHealth);
router.get("/health/diagnostics", healthController.performFullDiagnostics);

/**
 * Synchronization Routes
 */
router.post("/synchronize", authenticate, nodeController.synchronizeAll);

module.exports = router;