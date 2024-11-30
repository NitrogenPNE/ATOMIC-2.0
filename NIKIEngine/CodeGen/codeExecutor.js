"use strict";

const vm = require("vm");

/**
 * Executes a JavaScript code snippet safely in a sandboxed environment.
 * @param {string} code - The JavaScript code to execute.
 * @returns {Promise<any>} - Execution result or error details.
 */
async function executeCode(code) {
    try {
        console.log("[CodeExecutor] Running code in sandbox...");
        const sandbox = { console };
        vm.createContext(sandbox);

        const result = vm.runInContext(code, sandbox);
        console.log("[CodeExecutor] Code executed successfully.");
        return result;
    } catch (error) {
        console.error(`[CodeExecutor] Execution failed: ${error.message}`);
        throw new Error("Code execution failed: " + error.message);
    }
}

module.exports = { executeCode };