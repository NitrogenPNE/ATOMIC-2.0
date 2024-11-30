"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Plugin Manager
//
// Description:
// Provides dynamic plugin management for extending NIKI's functionality. 
// Includes plugin loading, activation, deactivation, and compatibility checks.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");

// Paths
const pluginsDirectory = path.resolve(__dirname, "./plugins");
const pluginRegistryFile = path.resolve(__dirname, "./pluginRegistry.json");

// Initialize plugin registry if it doesn't exist
(async function initializeRegistry() {
    if (!(await fs.pathExists(pluginRegistryFile))) {
        await fs.writeJson(pluginRegistryFile, { plugins: [] }, { spaces: 2 });
        console.log("[PluginManager] Plugin registry initialized.");
    }
})();

/**
 * Load all active plugins.
 * @returns {Promise<void>}
 */
async function loadPlugins() {
    try {
        const registry = await getPluginRegistry();

        for (const plugin of registry.plugins) {
            if (plugin.active) {
                const pluginPath = path.join(pluginsDirectory, plugin.file);
                if (await fs.pathExists(pluginPath)) {
                    const loadedPlugin = require(pluginPath);
                    console.log(`[PluginManager] Loaded plugin: ${plugin.name}`);
                    if (typeof loadedPlugin.initialize === "function") {
                        loadedPlugin.initialize();
                    }
                } else {
                    console.warn(`[PluginManager] Plugin file not found: ${plugin.file}`);
                }
            }
        }
    } catch (error) {
        console.error("[PluginManager] Error loading plugins:", error.message);
    }
}

/**
 * Add a new plugin to the registry.
 * @param {Object} plugin - Plugin metadata.
 * @param {string} plugin.name - Name of the plugin.
 * @param {string} plugin.file - File name of the plugin.
 * @param {boolean} [plugin.active=false] - Whether the plugin is active.
 */
async function addPlugin(plugin) {
    try {
        const registry = await getPluginRegistry();

        if (registry.plugins.some((p) => p.name === plugin.name)) {
            throw new Error(`[PluginManager] Plugin with name '${plugin.name}' already exists.`);
        }

        registry.plugins.push({ ...plugin, active: plugin.active || false });
        await fs.writeJson(pluginRegistryFile, registry, { spaces: 2 });
        console.log(`[PluginManager] Added plugin: ${plugin.name}`);
    } catch (error) {
        console.error("[PluginManager] Error adding plugin:", error.message);
    }
}

/**
 * Activate a plugin by name.
 * @param {string} pluginName - Name of the plugin to activate.
 */
async function activatePlugin(pluginName) {
    try {
        const registry = await getPluginRegistry();
        const plugin = registry.plugins.find((p) => p.name === pluginName);

        if (!plugin) {
            throw new Error(`[PluginManager] Plugin '${pluginName}' not found.`);
        }

        plugin.active = true;
        await fs.writeJson(pluginRegistryFile, registry, { spaces: 2 });
        console.log(`[PluginManager] Activated plugin: ${pluginName}`);
    } catch (error) {
        console.error("[PluginManager] Error activating plugin:", error.message);
    }
}

/**
 * Deactivate a plugin by name.
 * @param {string} pluginName - Name of the plugin to deactivate.
 */
async function deactivatePlugin(pluginName) {
    try {
        const registry = await getPluginRegistry();
        const plugin = registry.plugins.find((p) => p.name === pluginName);

        if (!plugin) {
            throw new Error(`[PluginManager] Plugin '${pluginName}' not found.`);
        }

        plugin.active = false;
        await fs.writeJson(pluginRegistryFile, registry, { spaces: 2 });
        console.log(`[PluginManager] Deactivated plugin: ${pluginName}`);
    } catch (error) {
        console.error("[PluginManager] Error deactivating plugin:", error.message);
    }
}

/**
 * Get the plugin registry.
 * @returns {Promise<Object>} - The plugin registry object.
 */
async function getPluginRegistry() {
    try {
        return await fs.readJson(pluginRegistryFile);
    } catch (error) {
        console.error("[PluginManager] Error reading plugin registry:", error.message);
        throw new Error("Failed to load plugin registry.");
    }
}

module.exports = {
    loadPlugins,
    addPlugin,
    activatePlugin,
    deactivatePlugin,
};

// ------------------------------------------------------------------------------
// End of Plugin Manager Module
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation for plugin management.
// ------------------------------------------------------------------------------