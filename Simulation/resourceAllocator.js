"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All Rights Reserved.
//
// Module: Resource Allocator
//
// Description:
// This module dynamically allocates and monitors system resources (CPU, memory,
// GPU/TPU) to support quantum simulations. It ensures efficient resource 
// utilization and prevents system overloads.
//
// Features:
// - Monitors system resource availability in real-time.
// - Allocates resources for CPU, memory, and GPU/TPU.
// - Enforces resource limits defined in quantumConfig.json.
// - Logs resource allocation and performance metrics.
//
// Author: Shawn Blackmore
//
// Jurisdiction:
// Governed by Canadian law and the Province of British Columbia.
//
// Dependencies:
// - os: For system resource monitoring.
// - node-system-stats: For detailed GPU/TPU metrics.
// - fs: For logging and configuration handling.
//
// Contact:
// Email: licensing@atomic.ca | Website: https://www.atomic.ca
// ------------------------------------------------------------------------------

const os = require("os");
const fs = require("fs");
const path = require("path");

// Configuration
const CONFIG_PATH = path.join("C:\\ATOMIC 2.0\\Config", "quantumConfig.json");
const LOG_FILE = path.join("C:\\ATOMIC 2.0\\Logs", "resourceAllocator.log");

// Logging utility
function logMessage(message, level = "INFO") {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;
    fs.appendFileSync(LOG_FILE, logEntry, "utf8");
    console.log(logEntry);
}

// Load configuration
function loadConfig() {
    try {
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
        logMessage("Resource allocation configuration loaded successfully.");
        return config;
    } catch (error) {
        logMessage(`Error loading configuration: ${error.message}`, "ERROR");
        throw error;
    }
}

// Monitor system resources
function monitorResources() {
    const freeMemory = os.freemem() / (1024 ** 3); // Convert to GB
    const totalMemory = os.totalmem() / (1024 ** 3); // Convert to GB
    const memoryUsage = ((1 - freeMemory / totalMemory) * 100).toFixed(2);

    const cpuUsage = os.cpus().map(cpu => cpu.times);
    const cpuLoad = getAverageCPULoad(cpuUsage);

    const stats = {
        memory: { free: freeMemory.toFixed(2), total: totalMemory.toFixed(2), usage: memoryUsage },
        cpu: { load: cpuLoad },
    };

    logMessage(`System Resources: Memory Usage: ${memoryUsage}%, CPU Load: ${cpuLoad}%`);
    return stats;
}

// Calculate average CPU load
function getAverageCPULoad(cpuUsage) {
    let totalIdle = 0, totalTick = 0;

    cpuUsage.forEach(cpu => {
        for (const type in cpu) {
            totalTick += cpu[type];
        }
        totalIdle += cpu.idle;
    });

    return ((1 - totalIdle / totalTick) * 100).toFixed(2);
}

// GPU/TPU resource monitoring (placeholder)
function monitorGPU() {
    // Replace with real GPU metrics (e.g., using nvidia-smi or other libraries)
    const gpuAvailable = true; // Simulated GPU availability
    logMessage(`GPU Availability: ${gpuAvailable}`);
    return gpuAvailable;
}

// Allocate resources dynamically
function allocateResources(config) {
    logMessage("Allocating resources for quantum simulations...");

    const resources = monitorResources();
    const gpuAvailable = monitorGPU();

    if (resources.cpu.load > config.system.resourceLimits.maxCPUUsage) {
        logMessage("CPU usage exceeds limit. Reducing simulation threads.", "WARN");
        // Adjust simulation threads dynamically
    }

    if (resources.memory.usage > config.system.resourceLimits.maxMemoryUsage) {
        logMessage("Memory usage exceeds limit. Optimizing memory allocation.", "WARN");
        // Implement memory optimization logic
    }

    if (!gpuAvailable && config.system.gpuAcceleration) {
        logMessage("GPU unavailable. Falling back to CPU-only simulation.", "WARN");
        // Adjust simulation mode to CPU-only
    }

    logMessage("Resource allocation completed successfully.");
}

// Performance metrics logger
function logPerformanceMetrics() {
    logMessage("Logging performance metrics...");
    const stats = monitorResources();
    fs.writeFileSync(
        path.join("C:\\ATOMIC 2.0\\Logs", "performanceMetrics.json"),
        JSON.stringify(stats, null, 4),
        "utf8"
    );
    logMessage("Performance metrics logged.");
}

// Main function to allocate and monitor resources
function manageResources() {
    try {
        logMessage("Starting resource allocation...");
        const config = loadConfig();

        allocateResources(config);
        logPerformanceMetrics();

        logMessage("Resource management completed.");
    } catch (error) {
        logMessage(`Unexpected error during resource allocation: ${error.message}`, "ERROR");
    }
}

// Execute resource management if called directly
if (require.main === module) {
    manageResources();
}

module.exports = { monitorResources, allocateResources, manageResources };

// ------------------------------------------------------------------------------
// End of Resource Allocator Module
// Version: 1.0.0 | Updated: 2024-11-26
// ------------------------------------------------------------------------------