"use strict";

const { generateScript } = require("../../CodeGen/scriptGenerator");

/**
 * Handles script generation requests from NIKI chat.
 * @param {string} scriptName - Desired script name.
 * @param {string} scriptContent - Content for the script.
 * @returns {Promise<string>} - Response message.
 */
async function handleScriptGeneration(scriptName, scriptContent) {
    console.log(`[ScriptGeneratorHandler] Handling request for script: ${scriptName}`);
    return await generateScript(scriptName, scriptContent);
}

module.exports = { handleScriptGeneration };
