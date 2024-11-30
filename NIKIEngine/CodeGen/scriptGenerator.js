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
// Dynamically generates JavaScript files based on user requirements via NIKI GPT.
// Validates scripts before storing them in the repository.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const fs = require("fs-extra");
const path = require("path");
const codeValidator = require("./codeValidator");
const codeRepositoryPath = path.resolve(__dirname, "codeRepository.json");

/**
 * Generates a script file based on the user requirements.
 * @param {string} scriptName - The name of the script to create.
 * @param {string} scriptContent - The JavaScript content for the script.
 * @returns {Promise<string>} - Success message or error details.
 */
async function generateScript(scriptName, scriptContent) {
    try {
        console.log(`[ScriptGenerator] Validating script: ${scriptName}`);
        const isValid = await codeValidator.validateScript(scriptContent);

        if (!isValid) {
            throw new Error("Script validation failed.");
        }

        const scriptPath = path.resolve(__dirname, `${scriptName}.js`);
        await fs.writeFile(scriptPath, scriptContent, "utf8");

        console.log(`[ScriptGenerator] Script generated successfully: ${scriptPath}`);
        await saveToRepository(scriptName, scriptContent);

        return `Script "${scriptName}" has been created and stored successfully.`;
    } catch (error) {
        console.error(`[ScriptGenerator] Error: ${error.message}`);
        return `Error generating script: ${error.message}`;
    }
}

/**
 * Saves the script to the code repository.
 * @param {string} scriptName - The name of the script.
 * @param {string} scriptContent - The script content.
 */
async function saveToRepository(scriptName, scriptContent) {
    const repository = await fs.readJson(codeRepositoryPath, { throws: false }) || {};
    repository[scriptName] = { content: scriptContent, createdAt: new Date().toISOString() };
    await fs.writeJson(codeRepositoryPath, repository, { spaces: 2 });
    console.log(`[ScriptGenerator] Script saved to repository: ${scriptName}`);
}

module.exports = { generateScript };
