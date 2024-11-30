"use strict";

// SPDX-License-Identifier: ATOMIC-Limited-1.0
// ------------------------------------------------------------------------------
// ATOMIC (Advanced Technologies Optimizing Integrated Chains)
// Copyright (c) 2023 ATOMIC, Ltd.
// All rights reserved.
//
// Module: API Connector
//
// Description:
// Provides a utility layer for managing API connections between NIKI Chat and 
// various ATOMIC subsystems, as well as external services like subscription 
// management and analytics platforms.
//
// Author: Shawn Blackmore
// ------------------------------------------------------------------------------

const axios = require("axios");

// **Global Configurations**
const BASE_URLS = {
    subscriptionService: "https://api.atomic.ca/subscriptions",
    monitoringService: "https://api.atomic.ca/monitoring",
    analyticsService: "https://api.atomic.ca/analytics",
    nodeRegistryService: "https://api.atomic.ca/nodes"
};

/**
 * Sends a GET request to a specified endpoint.
 * @param {string} service - The name of the service (e.g., 'subscriptionService').
 * @param {string} endpoint - The API endpoint to call.
 * @param {Object} [params] - Optional query parameters.
 * @returns {Promise<Object>} - The API response data.
 */
async function getRequest(service, endpoint, params = {}) {
    try {
        const url = `${BASE_URLS[service]}${endpoint}`;
        const response = await axios.get(url, { params });
        return response.data;
    } catch (error) {
        console.error(`[APIConnector] GET request failed: ${error.message}`);
        throw new Error(`Failed to fetch data from ${service}.`);
    }
}

/**
 * Sends a POST request to a specified endpoint.
 * @param {string} service - The name of the service (e.g., 'analyticsService').
 * @param {string} endpoint - The API endpoint to call.
 * @param {Object} data - The payload to send with the request.
 * @returns {Promise<Object>} - The API response data.
 */
async function postRequest(service, endpoint, data) {
    try {
        const url = `${BASE_URLS[service]}${endpoint}`;
        const response = await axios.post(url, data);
        return response.data;
    } catch (error) {
        console.error(`[APIConnector] POST request failed: ${error.message}`);
        throw new Error(`Failed to send data to ${service}.`);
    }
}

/**
 * Sends a PUT request to update data at a specified endpoint.
 * @param {string} service - The name of the service (e.g., 'nodeRegistryService').
 * @param {string} endpoint - The API endpoint to call.
 * @param {Object} data - The payload to update.
 * @returns {Promise<Object>} - The API response data.
 */
async function putRequest(service, endpoint, data) {
    try {
        const url = `${BASE_URLS[service]}${endpoint}`;
        const response = await axios.put(url, data);
        return response.data;
    } catch (error) {
        console.error(`[APIConnector] PUT request failed: ${error.message}`);
        throw new Error(`Failed to update data at ${service}.`);
    }
}

/**
 * Sends a DELETE request to remove data at a specified endpoint.
 * @param {string} service - The name of the service (e.g., 'monitoringService').
 * @param {string} endpoint - The API endpoint to call.
 * @returns {Promise<Object>} - The API response data.
 */
async function deleteRequest(service, endpoint) {
    try {
        const url = `${BASE_URLS[service]}${endpoint}`;
        const response = await axios.delete(url);
        return response.data;
    } catch (error) {
        console.error(`[APIConnector] DELETE request failed: ${error.message}`);
        throw new Error(`Failed to delete data from ${service}.`);
    }
}

/**
 * Configures a new base URL for a given service.
 * @param {string} service - The name of the service.
 * @param {string} baseUrl - The new base URL for the service.
 */
function configureBaseUrl(service, baseUrl) {
    if (!BASE_URLS[service]) {
        throw new Error(`[APIConnector] Service not found: ${service}`);
    }
    BASE_URLS[service] = baseUrl;
    console.log(`[APIConnector] Base URL updated for ${service}: ${baseUrl}`);
}

module.exports = {
    getRequest,
    postRequest,
    putRequest,
    deleteRequest,
    configureBaseUrl
};

// ------------------------------------------------------------------------------
// End of Module: API Connector
// Version: 1.0.0 | Updated: 2024-11-24
// Change Log: Initial implementation for managing API connections.
// ------------------------------------------------------------------------------