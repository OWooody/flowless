'use client';

import { useState, useEffect } from 'react';

export default function ApiDocsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">API Documentation</h1>

      <div className="space-y-12">
        {/* Events API */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Events API</h2>
          
          <div className="space-y-6">
            {/* Create Event */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-medium mb-4">Create Event</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Endpoint</h4>
                  <code className="block bg-gray-50 p-2 rounded">POST /api/events</code>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Request Body</h4>
                  <pre className="bg-gray-50 p-4 rounded overflow-x-auto">
{`{
  "name": "string",           // Required: Name of the event
  "properties": object,       // Optional: Additional properties
  "timestamp": "string",      // Optional: ISO timestamp
  "category": "string",       // Optional: Event category (default: "engagement")
  "path": "string",          // Optional: Page path
  "pageTitle": "string",     // Optional: Page title
  "action": "string",        // Optional: Action performed
  "itemName": "string",      // Optional: Name of the item
  "itemId": "string",        // Optional: ID of the item
  "itemCategory": "string",  // Optional: Category of the item
  "value": number,           // Optional: Numeric value
  "planId": "string",        // Optional: Plan identifier
  "userId": "string"         // Optional: User identifier
}`}
                  </pre>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Response</h4>
                  <pre className="bg-gray-50 p-4 rounded overflow-x-auto">
{`{
  "id": "string",
  "name": "string",
  "properties": object,
  "timestamp": "string",
  "createdAt": "string",
  "updatedAt": "string",
  "ipAddress": "string",
  "path": "string",
  "referrer": "string",
  "userAgent": "string",
  "action": "string",
  "category": "string",
  "itemCategory": "string",
  "itemId": "string",
  "itemName": "string",
  "pageTitle": "string",
  "value": number,
  "planId": "string",
  "userId": "string",
  "organizationId": "string"
}`}
                  </pre>
                </div>
              </div>
            </div>

            {/* List Events */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-medium mb-4">List Events</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Endpoint</h4>
                  <code className="block bg-gray-50 p-2 rounded">GET /api/events</code>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Query Parameters</h4>
                  <ul className="list-disc list-inside space-y-2">
                    <li><code>page</code> - Page number (default: 1)</li>
                    <li><code>limit</code> - Items per page (default: 20)</li>
                    <li><code>name</code> - Filter by event name</li>
                    <li><code>category</code> - Filter by category</li>
                    <li><code>startDate</code> - Filter by start date (ISO format)</li>
                    <li><code>endDate</code> - Filter by end date (ISO format)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Response</h4>
                  <pre className="bg-gray-50 p-4 rounded overflow-x-auto">
{`{
  "events": [
    {
      "id": "string",
      "name": "string",
      "properties": object,
      "timestamp": "string",
      "createdAt": "string",
      "updatedAt": "string",
      "ipAddress": "string",
      "path": "string",
      "referrer": "string",
      "userAgent": "string",
      "action": "string",
      "category": "string",
      "itemCategory": "string",
      "itemId": "string",
      "itemName": "string",
      "pageTitle": "string",
      "value": number,
      "planId": "string",
      "userId": "string",
      "organizationId": "string"
    }
  ],
  "pagination": {
    "total": number,
    "pages": number,
    "page": number,
    "limit": number
  }
}`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Get Event Details */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-medium mb-4">Get Event Details</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Endpoint</h4>
                  <code className="block bg-gray-50 p-2 rounded">GET /api/events/:id</code>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Response</h4>
                  <pre className="bg-gray-50 p-4 rounded overflow-x-auto">
{`{
  "id": "string",
  "name": "string",
  "properties": object,
  "timestamp": "string",
  "createdAt": "string",
  "updatedAt": "string",
  "ipAddress": "string",
  "path": "string",
  "referrer": "string",
  "userAgent": "string",
  "action": "string",
  "category": "string",
  "itemCategory": "string",
  "itemId": "string",
  "itemName": "string",
  "pageTitle": "string",
  "value": number,
  "planId": "string",
  "userId": "string",
  "organizationId": "string"
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Webhooks API */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Webhooks API</h2>
          
          <div className="space-y-6">
            {/* Create Webhook */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-medium mb-4">Create Webhook</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Endpoint</h4>
                  <code className="block bg-gray-50 p-2 rounded">POST /api/webhooks</code>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Request Body</h4>
                  <pre className="bg-gray-50 p-4 rounded overflow-x-auto">
{`{
  "url": "string",           // Required: Webhook URL
  "events": ["string"],      // Required: Array of event types to subscribe to
  "eventName": "string"      // Optional: Specific event name to track
}`}
                  </pre>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Response</h4>
                  <pre className="bg-gray-50 p-4 rounded overflow-x-auto">
{`{
  "id": "string",
  "url": "string",
  "events": ["string"],
  "eventName": "string",
  "isActive": boolean,
  "organizationId": "string",
  "createdAt": "string",
  "updatedAt": "string",
  "lastTriggered": "string",
  "failureCount": number
}`}
                  </pre>
                </div>
              </div>
            </div>

            {/* List Webhooks */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-medium mb-4">List Webhooks</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Endpoint</h4>
                  <code className="block bg-gray-50 p-2 rounded">GET /api/webhooks</code>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Response</h4>
                  <pre className="bg-gray-50 p-4 rounded overflow-x-auto">
{`{
  "webhooks": [
    {
      "id": "string",
      "url": "string",
      "events": ["string"],
      "eventName": "string",
      "isActive": boolean,
      "organizationId": "string",
      "createdAt": "string",
      "updatedAt": "string",
      "lastTriggered": "string",
      "failureCount": number
    }
  ]
}`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Delete Webhook */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-medium mb-4">Delete Webhook</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Endpoint</h4>
                  <code className="block bg-gray-50 p-2 rounded">DELETE /api/webhooks/:id</code>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Response</h4>
                  <pre className="bg-gray-50 p-4 rounded overflow-x-auto">
{`{
  "success": true
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
} 