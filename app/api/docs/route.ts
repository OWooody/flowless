import { NextResponse } from 'next/server';

export async function GET() {
  const docs = {
    openapi: '3.0.0',
    info: {
      title: 'Track Analytics API',
      version: '1.0.0',
      description: 'API documentation for Track Analytics Platform',
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
        description: 'API Server',
      },
    ],
    paths: {
      '/api/events': {
        post: {
          summary: 'Create a new event',
          description: 'Create a new analytics event',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', required: true },
                    category: { type: 'string', required: true },
                    properties: { type: 'object' },
                    timestamp: { type: 'string' },
                    path: { type: 'string' },
                    pageTitle: { type: 'string' },
                    action: { type: 'string' },
                    value: { type: 'number' },
                    userId: { type: 'string' },
                    organizationId: { type: 'string' },
                  },
                  required: ['name'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Event created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      properties: { type: 'object' },
                      timestamp: { type: 'string', format: 'date-time' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
            },
            '500': {
              description: 'Server error',
            },
          },
        },
      },
      '/api/webhooks': {
        post: {
          summary: 'Create a new webhook',
          description: 'Create a new webhook endpoint',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    url: { type: 'string', format: 'uri' },
                    events: { 
                      type: 'array',
                      items: { type: 'string' },
                      default: ['event.created']
                    },
                    eventName: { type: 'string' },
                  },
                  required: ['url'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Webhook created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      url: { type: 'string' },
                      events: { 
                        type: 'array',
                        items: { type: 'string' }
                      },
                      eventName: { type: 'string' },
                      isActive: { type: 'boolean' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
            },
            '500': {
              description: 'Server error',
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  };

  return NextResponse.json(docs);
} 