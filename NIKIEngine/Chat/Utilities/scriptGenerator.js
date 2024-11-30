"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Script Generator
//
// Description:
// Dynamically generates scripts in supported programming languages based on 
// user inputs and system requirements. Adheres to configurations in 
// scriptWritingConfig.json for security and compliance.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const { validateScript } = require("./errorHandler");
const scriptConfigPath = path.resolve(__dirname, "../Config/scriptWritingConfig.json");

// **Global Constants**
let config;

// **Load Configuration**
async function loadConfig() {
    if (!config) {
        config = await fs.readJson(scriptConfigPath);
    }
    return config;
}

/**
 * Generate a script based on user input and default templates.
 * @param {string} language - The desired programming language (e.g., JavaScript, Python).
 * @param {string} purpose - A brief description of the script's functionality.
 * @param {Object} requirements - Specific requirements for the script.
 * @returns {Promise<string>} - The generated script content.
 */
async function generateScript(language, purpose, requirements) {
    const cfg = await loadConfig();

    if (!cfg.scriptWriting.enabled) {
        throw new Error("[ScriptGenerator] Script writing is disabled in configuration.");
    }

    if (!cfg.scriptWriting.supportedLanguages.includes(language)) {
        throw new Error(`[ScriptGenerator] Unsupported language: ${language}`);
    }

    const templatePath = path.join(
        cfg.scriptWriting.directories.codeGeneration,
        cfg.scriptWriting.defaultTemplates[0] // Using the first default template
    );

    const template = await loadTemplate(templatePath);
    const script = buildScriptFromTemplate(template, purpose, requirements, language);

    await validateScript(script, cfg.scriptWriting.securityChecks);

    return script;
}

/**
 * Load a default script template.
 * @param {string} templatePath - Path to the script template file.
 * @returns {Promise<Object>} - Parsed template data.
 */
async function loadTemplate(templatePath) {
    try {
        const template = await fs.readJson(templatePath);
        return template;
    } catch (error) {
        throw new Error(`[ScriptGenerator] Failed to load template: ${error.message}`);
    }
}

/**
 * Build a script from a given template.
 * @param {Object} template - The base template for the script.
 * @param {string} purpose - A description of the script's functionality.
 * @param {Object} requirements - Requirements for the script.
 * @param {string} language - The target programming language.
 * @returns {string} - Generated script as a string.
 */
function buildScriptFromTemplate(template, purpose, requirements, language) {
    let script = template[language]?.base || "";

    script = script.replace("{{purpose}}", purpose);
    script = script.replace("{{requirements}}", JSON.stringify(requirements, null, 2));

    return script;
}

/**
 * Save the generated script to a file.
 * @param {string} filePath - The path where the script will be saved.
 * @param {string} scriptContent - The generated script content.
 * @returns {Promise<void>}
 */
async function saveScript(filePath, scriptContent) {
    try {
        await fs.ensureFile(filePath);
        await fs.writeFile(filePath, scriptContent, "utf-8");
        console.log(`[ScriptGenerator] Script saved at: ${filePath}`);
    } catch (error) {
        throw new Error(`[ScriptGenerator] Failed to save script: ${error.message}`);
    }
}

module.exports = {
    generateScript,
    saveScript,
};

// ------------------------------------------------------------------------------
// End of Module: Script Generator
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation for dynamic script generation.
// ------------------------------------------------------------------------------