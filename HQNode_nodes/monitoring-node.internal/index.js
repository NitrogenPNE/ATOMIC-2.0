"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC Monitoring Node Entry Point
// ------------------------------------------------------------------------------

const { startWebhookService } = require("./Services/webhookService");

console.log("Starting Monitoring Node...");
startWebhookService();
