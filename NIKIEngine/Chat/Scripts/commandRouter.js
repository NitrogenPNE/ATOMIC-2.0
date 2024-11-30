"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Command Router
//
// Description:
// Routes user commands from NIKI's chat interface to appropriate modules for 
// execution. Ensures secure and efficient processing of commands for ATOMIC's 
// operations, including node management, subscription queries, and task scheduling.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const { exec } = require("child_process");
const { validateCommand } = require("../Validation/queryValidator");
const chatConfig = require("../Config/chatConfig.json");
const nodeRegistry = require("../../NodeManagement/nodeRegistry");
const subscriptionManager = require("../../Subscriptions/subscriptionManager");
const taskScheduler = require("../../Tasks/taskScheduler");

// **Command Handler Mapping**
const commandHandlers = {
    "node:add": addNode,
    "node:remove": removeNode,
    "subscription:status": getSubscriptionStatus,
    "task:schedule": scheduleTask,
    "system:exec": executeSystemCommand
};

/**
 * Routes a command to the appropriate handler.
 * @param {string} command - User command.
 * @param {Object} context - Command context, including metadata.
 * @returns {Promise<Object>} - Execution result or error message.
 */
async function routeCommand(command, context) {
    try {
        // Step 1: Validate command
        if (!validateCommand(command)) {
            throw new Error(`Invalid command: ${command}`);
        }

        // Step 2: Extract command and arguments
        const [action, ...args] = command.split(" ");
        const handler = commandHandlers[action];

        if (!handler) {
            throw new Error(`Unsupported command: ${action}`);
        }

        // Step 3: Execute command handler
        const result = await handler(args, context);

        return { success: true, result };
    } catch (error) {
        console.error(`[CommandRouter] Error executing command: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// **Command Handlers**
/**
 * Adds a new node to the system.
 * @param {Array<string>} args - Command arguments.
 * @param {Object} context - Command context.
 * @returns {Promise<string>} - Success message.
 */
async function addNode(args, context) {
    const [nodeId, nodeType] = args;

    if (!nodeId || !nodeType) {
        throw new Error("Usage: node:add <nodeId> <nodeType>");
    }

    await nodeRegistry.addNode(context.hqId, { id: nodeId, type: nodeType });
    return `Node ${nodeId} of type ${nodeType} added successfully.`;
}

/**
 * Removes a node from the system.
 * @param {Array<string>} args - Command arguments.
 * @param {Object} context - Command context.
 * @returns {Promise<string>} - Success message.
 */
async function removeNode(args, context) {
    const [nodeId] = args;

    if (!nodeId) {
        throw new Error("Usage: node:remove <nodeId>");
    }

    await nodeRegistry.removeNode(context.hqId, nodeId);
    return `Node ${nodeId} removed successfully.`;
}

/**
 * Retrieves the current subscription status.
 * @param {Array<string>} args - Command arguments (unused).
 * @param {Object} context - Command context.
 * @returns {Promise<Object>} - Subscription status.
 */
async function getSubscriptionStatus(args, context) {
    return await subscriptionManager.getSubscriptionStatus(context.hqId);
}

/**
 * Schedules a task in the system.
 * @param {Array<string>} args - Command arguments.
 * @param {Object} context - Command context.
 * @returns {Promise<string>} - Success message.
 */
async function scheduleTask(args, context) {
    const [taskId, priority] = args;

    if (!taskId || !priority) {
        throw new Error("Usage: task:schedule <taskId> <priority>");
    }

    await taskScheduler.scheduleTask({ id: taskId, priority: parseInt(priority, 10) });
    return `Task ${taskId} scheduled with priority ${priority}.`;
}

/**
 * Executes a system command (restricted to authorized users).
 * @param {Array<string>} args - Command arguments.
 * @param {Object} context - Command context.
 * @returns {Promise<string>} - Command output.
 */
async function executeSystemCommand(args, context) {
    if (!context.isAdmin) {
        throw new Error("Permission denied: Admin privileges are required to execute system commands.");
    }

    const command = args.join(" ");

    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`Error: ${stderr || error.message}`);
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

module.exports = {
    routeCommand
};

// ------------------------------------------------------------------------------
// End of Module: Command Router
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation for secure command routing.
// ------------------------------------------------------------------------------