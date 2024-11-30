"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Template Manager
//
// Description:
// Manages retrieval, customization, and storage of smart contract templates for 
// the National Defense HQ Node.
//
// Author: Shawn Blackmore
//
// Dependencies:
// - fs-extra: File operations.
// - path: Handles contract template paths.
//
// Usage:
// const { getTemplate, saveTemplate } = require('./templateManager');
// const template = await getTemplate('defaultTemplate.json');
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");

// Directory for smart contract templates
const TEMPLATE_DIR = path.resolve(__dirname, "./templates");

/**
 * Retrieves a specified smart contract template.
 * @param {string} templateName - The name of the template file.
 * @returns {Promise<Object>} - Parsed JSON content of the template.
 */
async function getTemplate(templateName) {
    try {
        const templatePath = path.join(TEMPLATE_DIR, templateName);

        if (!(await fs.pathExists(templatePath))) {
            throw new Error(`Template not found: ${templateName}`);
        }

        const template = await fs.readJson(templatePath);
        return template;
    } catch (error) {
        console.error(`Failed to retrieve template: ${error.message}`);
        throw error;
    }
}

/**
 * Saves a new or updated template to the template directory.
 * @param {string} templateName - The name of the template file.
 * @param {Object} templateContent - JSON content of the template.
 * @returns {Promise<void>}
 */
async function saveTemplate(templateName, templateContent) {
    try {
        const templatePath = path.join(TEMPLATE_DIR, templateName);

        await fs.ensureDir(TEMPLATE_DIR);
        await fs.writeJson(templatePath, templateContent, { spaces: 2 });

        console.log(`Template saved: ${templateName}`);
    } catch (error) {
        console.error(`Failed to save template: ${error.message}`);
        throw error;
    }
}

module.exports = {
    getTemplate,
    saveTemplate,
};

// ------------------------------------------------------------------------------
// End of Module: Template Manager
// Version: 1.0.0 | Updated: 2024-11-24
// ------------------------------------------------------------------------------
