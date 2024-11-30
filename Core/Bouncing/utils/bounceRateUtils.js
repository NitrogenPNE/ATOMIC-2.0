"use strict"; // Enforce strict mode

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd. All rights reserved.
//
// Version: 1.0.0
// Module: Bounce Rate Calculation
//
// Description:
// This module provides the functionality to calculate bounce rates from 
// frequency values. It ensures that only valid, non-zero frequencies are used 
// in the calculation and returns the average bounce rate in milliseconds.
//
// Formula:
// Bounce Rate (ms) = (1 / Frequency) * 1000
//
// Author: Shawn Blackmore
//
// Jurisdiction:
// This software is governed by the laws of the Province of British Columbia 
// and the laws of Canada applicable therein.
//
// Dependencies:
// None.
//
// Usage:
// Import the function and provide an array of frequencies to calculate the 
// average bounce rate.
//
// Example:
// ```javascript
// const { calculateBounceRate } = require('./path/to/module');
// const rates = [10, 20, 30]; // Example frequencies in Hz
// console.log(calculateBounceRate(rates)); // Outputs: 66.67 (ms)
// ```
//
// Change Log:
// - Version 1.0.0: Initial release.
//
// Contact:
// For inquiries about licensing and usage, please contact:
// - Email: licensing@atomic.ca
// - Website: https://www.atomic.ca
// ------------------------------------------------------------------------------

function calculateBounceRate(frequencies) {
    if (!Array.isArray(frequencies) || frequencies.length === 0) {
        throw new Error('Frequencies must be a non-empty array.');
    }

    // Convert each frequency to bounce rate (ms) and filter valid ones
    const validRates = frequencies
        .map(freq => (freq > 0 ? (1 / freq) * 1000 : null))
        .filter(rate => rate !== null); // Skip invalid/zero frequencies

    if (validRates.length === 0) {
        throw new Error('No valid frequencies to calculate bounce rate.');
    }

    // Calculate the average bounce rate
    const totalBounceRate = validRates.reduce((acc, rate) => acc + rate, 0);
    const averageRate = totalBounceRate / validRates.length;

    return parseFloat(averageRate.toFixed(2)); // Return as numeric value in ms
}

module.exports = { calculateBounceRate };

// ------------------------------------------------------------------------------
// End of Bounce Rate Calculation Module
// Version: 1.0.0 | Updated: 2024-10-30
// Change Log: See CHANGELOG.md for details.
// ------------------------------------------------------------------------------