"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: Code Analysis
//
// Description:
// Analyzes JavaScript code for structural insights, security vulnerabilities, 
// and compliance with ATOMIC's coding guidelines.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const esprima = require("esprima");

/**
 * Analyzes JavaScript code and generates a report.
 * @param {string} code - The JavaScript code to analyze.
 * @returns {Object} - Analysis report.
 */
function analyzeCode(code) {
    const report = {
        syntaxErrors: [],
        globalVariables: [],
        disallowedPatterns: [],
        functionCount: 0,
        complexityWarnings: [],
    };

    try {
        console.log("[CodeAnalysis] Parsing the code...");
        const ast = esprima.parseScript(code, { tolerant: true, loc: true });

        report.syntaxErrors = ast.errors || [];
        report.globalVariables = extractGlobalVariables(ast);
        report.functionCount = countFunctions(ast);
        report.disallowedPatterns = checkDisallowedPatterns(code);
        report.complexityWarnings = checkComplexity(ast);

        console.log("[CodeAnalysis] Code analysis completed successfully.");
    } catch (error) {
        console.error(`[CodeAnalysis] Error during analysis: ${error.message}`);
        report.syntaxErrors.push({ message: error.message });
    }

    return report;
}

/**
 * Extracts global variables from the AST.
 * @param {Object} ast - Abstract Syntax Tree (AST) of the code.
 * @returns {Array<string>} - List of global variable names.
 */
function extractGlobalVariables(ast) {
    const globals = new Set();

    esprima.traverse(ast, {
        enter: (node) => {
            if (node.type === "VariableDeclaration" && node.kind === "var") {
                node.declarations.forEach((decl) => {
                    if (decl.id.type === "Identifier") {
                        globals.add(decl.id.name);
                    }
                });
            }
        },
    });

    return Array.from(globals);
}

/**
 * Counts the number of functions in the AST.
 * @param {Object} ast - Abstract Syntax Tree (AST) of the code.
 * @returns {number} - Total number of functions.
 */
function countFunctions(ast) {
    let functionCount = 0;

    esprima.traverse(ast, {
        enter: (node) => {
            if (node.type === "FunctionDeclaration" || node.type === "FunctionExpression") {
                functionCount++;
            }
        },
    });

    return functionCount;
}

/**
 * Checks for disallowed patterns in the code.
 * @param {string} code - JavaScript code as a string.
 * @returns {Array<string>} - List of disallowed patterns found.
 */
function checkDisallowedPatterns(code) {
    const disallowedPatterns = [
        { pattern: /eval\(/, message: "Usage of 'eval' is disallowed." },
        { pattern: /Function\(/, message: "Usage of 'Function' constructor is disallowed." },
        { pattern: /while\s*\(true\)/, message: "Infinite loops are discouraged." },
    ];

    return disallowedPatterns
        .filter((check) => check.pattern.test(code))
        .map((check) => check.message);
}

/**
 * Checks for code complexity warnings.
 * @param {Object} ast - Abstract Syntax Tree (AST) of the code.
 * @returns {Array<string>} - List of complexity warnings.
 */
function checkComplexity(ast) {
    const warnings = [];
    const maxStatementsPerFunction = 20;

    esprima.traverse(ast, {
        enter: (node) => {
            if (node.type === "FunctionDeclaration" || node.type === "FunctionExpression") {
                if (node.body && node.body.body.length > maxStatementsPerFunction) {
                    warnings.push(
                        `Function '${node.id?.name || "anonymous"}' has too many statements (${node.body.body.length}).`
                    );
                }
            }
        },
    });

    return warnings;
}

/**
 * Generates a human-readable analysis summary.
 * @param {Object} report - Analysis report.
 * @returns {string} - Summary of the analysis.
 */
function generateSummary(report) {
    return `
Code Analysis Summary:
- Syntax Errors: ${report.syntaxErrors.length}
- Global Variables: ${report.globalVariables.length} (${report.globalVariables.join(", ") || "None"})
- Function Count: ${report.functionCount}
- Disallowed Patterns: ${report.disallowedPatterns.length} (${report.disallowedPatterns.join(", ") || "None"})
- Complexity Warnings: ${report.complexityWarnings.length} (${report.complexityWarnings.join(", ") || "None"})
`;
}

module.exports = {
    analyzeCode,
    generateSummary,
};

// ------------------------------------------------------------------------------
// End of Module: Code Analysis
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation of code analysis and reporting.
// ------------------------------------------------------------------------------