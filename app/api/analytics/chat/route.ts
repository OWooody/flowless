import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { redis } from '../../../lib/redis';
import crypto from 'crypto';
import * as Sentry from '@sentry/nextjs';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Safety constants
const DANGEROUS_KEYWORDS = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'CREATE', 'ALTER', 'TRUNCATE'];
const MAX_RESULTS = 10000;
const QUERY_TIMEOUT = 30000; // 30 seconds

// Function definitions for OpenAI
const functions = [
  {
    name: 'execute_analytics_query',
    description: 'Execute a safe analytics query and return results with insights',
    parameters: {
      type: 'object',
      properties: {
        query_type: {
          type: 'string',
          enum: ['user_segment', 'event_analysis', 'trend_analysis', 'behavior_pattern', 'campaign_analysis'],
          description: 'Type of analysis being performed'
        },
        sql_query: {
          type: 'string',
          description: 'The SQL query to execute (must be SELECT only)'
        },
        description: {
          type: 'string',
          description: 'Human-readable description of what this query does'
        },
        suggested_actions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Suggested next actions based on the results'
        }
      },
      required: ['query_type', 'sql_query', 'description']
    }
  },
  {
    name: 'create_user_segment',
    description: 'Create a user segment based on behavior patterns',
    parameters: {
      type: 'object',
      properties: {
        segment_name: {
          type: 'string',
          description: 'Name for the user segment'
        },
        description: {
          type: 'string',
          description: 'Description of the segment'
        },
        criteria: {
          type: 'string',
          description: 'SQL query to define the segment. Must be a valid SELECT query that returns distinct userId values from the Event table. Example: SELECT DISTINCT userId FROM "Event" WHERE name = \'purchase\' AND timestamp > NOW() - INTERVAL \'30 days\''
        },
        estimated_count: {
          type: 'number',
          description: 'Estimated number of users in this segment'
        }
      },
      required: ['segment_name', 'description', 'criteria']
    }
  },
  {
    name: 'create_notification_campaign',
    description: 'Create a notification campaign for a user segment',
    parameters: {
      type: 'object',
      properties: {
        campaign_name: {
          type: 'string',
          description: 'Name for the campaign'
        },
        message: {
          type: 'string',
          description: 'Message to send to users'
        },
        offer_code: {
          type: 'string',
          description: 'Optional offer or discount code'
        },
        target_segment: {
          type: 'string',
          description: 'Description of target segment'
        },
        estimated_users: {
          type: 'number',
          description: 'Estimated number of users to target'
        }
      },
      required: ['campaign_name', 'message', 'target_segment']
    }
  }
];

// Query safety validation
function isQuerySafe(sql: string): boolean {
  const upperSql = sql.toUpperCase();
  
  // Check for dangerous keywords
  if (DANGEROUS_KEYWORDS.some(keyword => upperSql.includes(keyword))) {
    return false;
  }
  
  // Must start with SELECT or WITH (for CTEs)
  const trimmedSql = upperSql.trim();
  if (!trimmedSql.startsWith('SELECT') && !trimmedSql.startsWith('WITH')) {
    return false;
  }
  
  // If it starts with WITH, it must contain SELECT later
  if (trimmedSql.startsWith('WITH') && !trimmedSql.includes('SELECT')) {
    return false;
  }
  
  // No multiple statements
  if (upperSql.includes(';') && upperSql.split(';').length > 2) {
    return false;
  }
  
  return true;
}

// Fix common column name issues in SQL queries
function fixColumnNames(sql: string): string {
  let fixedSql = sql;
  
  // Fix common lowercase column name issues
  const columnFixes = [
    { from: /\buserid\b/gi, to: 'userId' },
    { from: /\borganizationid\b/gi, to: 'organizationId' },
    { from: /\bcreatedat\b/gi, to: 'createdAt' },
    { from: /\bupdatedat\b/gi, to: 'updatedAt' },
    { from: /\bpagetitle\b/gi, to: 'pageTitle' },
    { from: /\bitemcategory\b/gi, to: 'itemCategory' },
    { from: /\bitemid\b/gi, to: 'itemId' },
    { from: /\bitemname\b/gi, to: 'itemName' },
    { from: /\buseragent\b/gi, to: 'userAgent' },
    { from: /\bipaddress\b/gi, to: 'ipAddress' },
    { from: /\blasttriggered\b/gi, to: 'lastTriggered' },
    { from: /\bfailurecount\b/gi, to: 'failureCount' },
    { from: /\beventname\b/gi, to: 'eventName' },
  ];
  
  columnFixes.forEach(fix => {
    fixedSql = fixedSql.replace(fix.from, fix.to);
  });
  
  return fixedSql;
}

// Execute safe query with timeout
async function executeSafeQuery(sql: string, timeoutMs: number = QUERY_TIMEOUT, userId?: string) {
  // Fix common column name issues before validation
  sql = fixColumnNames(sql);
  
  if (!isQuerySafe(sql)) {
    throw new Error('Query not allowed for security reasons');
  }
  
  // Add LIMIT if not present
  if (!sql.toUpperCase().includes('LIMIT')) {
    sql += ` LIMIT ${MAX_RESULTS}`;
  }

  // --- Redis Caching Logic ---
  let cacheKey = null;
  let cacheStatus = 'none';
  if (userId) {
    const hash = crypto.createHash('sha256').update(sql + ':' + userId).digest('hex');
    cacheKey = `analytics:result:${userId}:${hash}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        cacheStatus = 'hit';
        console.log('[Redis] Cache hit for key:', cacheKey);
        Sentry.addBreadcrumb({
          category: 'redis',
          message: 'Cache hit',
          data: { cacheKey },
          level: 'info',
        });
        return JSON.parse(cached);
      } else {
        cacheStatus = 'miss';
        console.log('[Redis] Cache miss for key:', cacheKey);
        Sentry.addBreadcrumb({
          category: 'redis',
          message: 'Cache miss',
          data: { cacheKey },
          level: 'info',
        });
      }
    } catch (err) {
      cacheStatus = 'error';
      console.error('[Redis] Error checking cache:', err);
      Sentry.captureException(err, { level: 'warning', tags: { cacheKey } });
    }
  }
  // --- End Redis Caching Logic ---

  // --- Sentry Performance Monitoring ---
  const queryHash = crypto.createHash('sha256').update(sql).digest('hex');
  const start = Date.now();
  // --- End Sentry Performance Monitoring ---
  
  // Execute with timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Query timeout')), timeoutMs);
  });
  
  const queryPromise = prisma.$queryRawUnsafe(sql);
  
  try {
    const results = await Promise.race([queryPromise, timeoutPromise]);
    const duration = Date.now() - start;

    // Convert BigInt values to numbers for JSON serialization
    const serializeResults = (data: any): any => {
      if (Array.isArray(data)) {
        return data.map(serializeResults);
      } else if (data && typeof data === 'object') {
        const serialized: any = {};
        for (const [key, value] of Object.entries(data)) {
          serialized[key] = serializeResults(value);
        }
        return serialized;
      } else if (typeof data === 'bigint') {
        return Number(data);
      }
      return data;
    };

    const serialized = serializeResults(results);

    // --- Redis Cache Set ---
    if (cacheKey) {
      try {
        await redis.set(cacheKey, JSON.stringify(serialized), { EX: 600 }); // 10 min TTL
        console.log('[Redis] Cached result for key:', cacheKey);
      } catch (err) {
        console.error('[Redis] Error setting cache:', err);
        Sentry.captureException(err, { level: 'warning', tags: { cacheKey } });
      }
    }
    // --- End Redis Cache Set ---

    // --- Sentry Performance Monitoring End ---
    Sentry.addBreadcrumb({
      category: 'analytics.query',
      message: 'Query executed',
      data: {
        userId,
        cacheKey,
        cacheStatus,
        queryHash,
        duration,
      },
      level: duration > 1000 ? 'warning' : 'info',
    });
    if (duration > 1000) {
      Sentry.captureMessage('Slow analytics query', {
        level: 'warning',
        tags: { userId, cacheKey, queryHash },
        extra: { sql, duration, cacheStatus },
      });
    }
    // --- End Sentry Performance Monitoring End ---

    return serialized;
  } catch (error) {
    if (error instanceof Error && error.message === 'Query timeout') {
      Sentry.captureMessage('Analytics query timeout', {
        level: 'error',
        tags: { userId, cacheKey, queryHash },
        extra: { sql, cacheStatus },
      });
      throw new Error('Query took too long to execute');
    }
    Sentry.captureException(error, {
      level: 'error',
      tags: { userId, cacheKey, queryHash },
      extra: { sql, cacheStatus },
    });
    throw error;
  }
}

// Create user segment
async function createUserSegment(segmentData: any, userId: string, organizationId?: string, fromAiChat: boolean = false) {
  // Validate that criteria is a SQL query
  if (!segmentData.criteria || typeof segmentData.criteria !== 'string') {
    throw new Error('Criteria must be a valid SQL query string');
  }

  const criteria = segmentData.criteria.trim();
  
  // Basic SQL validation
  if (!criteria.toUpperCase().startsWith('SELECT')) {
    throw new Error('Criteria must be a valid SELECT query');
  }

  // Check if it's trying to select userId
  if (!criteria.toUpperCase().includes('USERID')) {
    throw new Error('Query must select userId from the Event table');
  }

  // Execute the query to get the actual user count
  let actualUserCount = 0;
  try {
    // Fix column names in the criteria before executing
    const fixedCriteria = fixColumnNames(criteria);
    const results = await executeSafeQuery(fixedCriteria, QUERY_TIMEOUT, userId);
    actualUserCount = results.length;
  } catch (error) {
    console.error('Error executing segment query for user count:', error);
    // If query fails, use estimated count or 0
    actualUserCount = segmentData.estimated_count || 0;
  }

  console.log('Creating segment with data:', {
    name: segmentData.segment_name,
    description: segmentData.description,
    createdFromAiChat: fromAiChat,
    userId: userId,
    organizationId: organizationId || null
  });

  const segment = await prisma.userSegment.create({
    data: {
      name: segmentData.segment_name,
      description: segmentData.description,
      query: criteria,
      userCount: actualUserCount,
      criteria: { criteria: criteria },
      createdFromAiChat: fromAiChat,
      userId: userId,
      organizationId: organizationId || null
    } as any
  });

  console.log('Created segment:', {
    id: segment.id,
    name: segment.name,
    createdFromAiChat: (segment as any).createdFromAiChat
  });
  
  return segment;
}

// Create notification campaign
async function createNotificationCampaign(campaignData: any, userId: string, organizationId?: string) {
  const campaign = await prisma.notificationCampaign.create({
    data: {
      name: campaignData.campaign_name,
      message: campaignData.message,
      offerCode: campaignData.offer_code,
      targetSegment: campaignData.target_segment,
      estimatedUsers: campaignData.estimated_users,
      userId: userId,
      organizationId: organizationId || null
    }
  });
  
  return campaign;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, conversationId, function_call, function_args } = await request.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Handle direct function calls (for segment creation from frontend)
    if (function_call && function_args) {
      const functionName = function_call;
      let result;

      switch (functionName) {
        case 'create_segment_from_query':
          try {
            const segmentData = {
              segment_name: function_args.segment_name,
              description: function_args.description,
              criteria: function_args.sql_query,
              estimated_count: function_args.estimated_count || 0
            };
            
            const segment = await createUserSegment(segmentData, session.userId, session.orgId, true);
            result = {
              type: 'segment_created',
              segment: segment,
              description: `Successfully created segment: ${segment.name}`
            };
          } catch (error) {
            result = {
              type: 'error',
              message: `Failed to create segment: ${error instanceof Error ? error.message : 'Unknown error'}`,
              description: function_args.description,
              sql_query: function_args.sql_query
            };
          }
          break;

        default:
          result = {
            type: 'error',
            message: 'Unknown function called'
          };
      }

      return NextResponse.json(result);
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
      });
    }
    
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId: session.userId,
          messages: [],
          state: {}
        }
      });
    }
    
    const conversationHistory = conversation.messages || [];

    // Fetch knowledge base context
    let knowledgeContext = '';
    try {
      // Pass Clerk session cookies to maintain authentication
      const knowledgeResponse = await fetch(`${request.nextUrl.origin}/api/knowledge/query`, {
        headers: {
          'Cookie': request.headers.get('cookie') || '',
          'Content-Type': 'application/json'
        }
      });
      
      if (knowledgeResponse.ok) {
        const knowledgeData = await knowledgeResponse.json();
        console.log('Knowledge base fetched successfully:', {
          eventDefinitions: knowledgeData.eventDefinitions?.length || 0,
          businessMetrics: knowledgeData.businessMetrics?.length || 0,
          knowledgeEntries: knowledgeData.knowledgeEntries?.length || 0
        });
        
        if (knowledgeData.eventDefinitions?.length > 0) {
          knowledgeContext += '\n\nEVENT DEFINITIONS (use these exact event names in queries):\n';
          knowledgeData.eventDefinitions.forEach((ed: any) => {
            knowledgeContext += `- ${ed.name}: ${ed.description} (Category: ${ed.category})\n`;
            if (ed.properties) {
              knowledgeContext += `  Properties: ${JSON.stringify(ed.properties)}\n`;
            }
            if (ed.examples) {
              knowledgeContext += `  Examples: ${JSON.stringify(ed.examples)}\n`;
            }
          });
        }
        
        if (knowledgeData.businessMetrics?.length > 0) {
          knowledgeContext += '\n\nBUSINESS METRICS (use these formulas when relevant):\n';
          knowledgeData.businessMetrics.forEach((bm: any) => {
            knowledgeContext += `- ${bm.name}: ${bm.description}\n`;
            knowledgeContext += `  Formula: ${bm.formula}\n`;
            if (bm.unit) {
              knowledgeContext += `  Unit: ${bm.unit}\n`;
            }
          });
        }
        
        if (knowledgeData.knowledgeEntries?.length > 0) {
          knowledgeContext += '\n\nBUSINESS KNOWLEDGE:\n';
          knowledgeData.knowledgeEntries.forEach((ke: any) => {
            knowledgeContext += `- ${ke.title}: ${ke.content}\n`;
            if (ke.tags?.length > 0) {
              knowledgeContext += `  Tags: ${ke.tags.join(', ')}\n`;
            }
          });
        }
      } else {
        console.error('Failed to fetch knowledge base:', knowledgeResponse.status, knowledgeResponse.statusText);
      }
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
    }

    // Create system prompt with database schema context
    const systemPrompt = `You are an intelligent analytics assistant for a user behavior tracking platform with 1M+ events.

Available database schema:
- Event table (use quoted '"Event"'): 
  * id (String, primary key)
  * name (String) - event name
  * properties (Json, optional) - additional event data
  * timestamp (DateTime) - when event occurred
  * createdAt (DateTime) - record creation time
  * updatedAt (DateTime) - record update time
  * ipAddress (String, optional) - user's IP address
  * referrer (String, optional) - referring URL
  * userAgent (String, optional) - browser user agent
  * action (String, optional) - user action performed
  * category (String, default: "engagement") - event category
  * itemCategory (String, optional) - category of item interacted with
  * itemId (String, optional) - ID of item interacted with
  * itemName (String, optional) - name of item interacted with
  * pageTitle (String, optional) - page title where event occurred
  * path (String, optional) - URL path where event occurred
  * value (Float, optional) - numeric value associated with event
  * planId (String, optional) - user's plan/subscription ID
  * organizationId (String, optional) - organization ID
  * userId (String, optional) - user ID (CamelCase, not lowercase)

- Webhook table (use quoted '"Webhook"'): 
  * id (String, primary key)
  * url (String) - webhook endpoint URL
  * secret (String) - webhook secret
  * events (String[]) - array of event types to trigger on
  * isActive (Boolean) - whether webhook is active
  * organizationId (String, optional) - organization ID
  * createdAt (DateTime) - creation time
  * updatedAt (DateTime) - update time
  * lastTriggered (DateTime, optional) - last trigger time
  * failureCount (Int) - number of failed attempts
  * eventName (String, optional) - specific event name filter

CRITICAL: Column names are case-sensitive! Use exact names:
- userId (CamelCase), NOT userid (lowercase) - THIS IS THE MOST IMPORTANT ONE
- organizationId (CamelCase), NOT organizationid
- createdAt (CamelCase), NOT createdat
- updatedAt (CamelCase), NOT updatedat
- pageTitle (CamelCase), NOT pagetitle
- itemCategory (CamelCase), NOT itemcategory
- itemId (CamelCase), NOT itemid
- itemName (CamelCase), NOT itemname
- userAgent (CamelCase), NOT useragent
- ipAddress (CamelCase), NOT ipaddress
- lastTriggered (CamelCase), NOT lasttriggered
- failureCount (CamelCase), NOT failurecount
- eventName (CamelCase), NOT eventname

⚠️ WARNING: If you use lowercase "userid" instead of "userId", the query will fail with "column userid does not exist" error!${knowledgeContext}

You can:
1. Execute safe SQL queries to analyze data
2. Create user segments based on behavior patterns
3. Suggest notification campaigns for user segments
4. Provide insights and recommendations

When users ask for data analysis, use the execute_analytics_query function.
When users want to create segments, use the create_user_segment function.
When users want to send notifications, use the create_notification_campaign function.

IMPORTANT: Always use quoted table names in SQL queries: '"Event"' not 'Event' or 'event', '"Webhook"' not 'Webhook' or 'webhook'.
When referencing events, use the exact event names from the knowledge base if available.

SEGMENT CREATION RULES:
- When creating user segments, the 'criteria' field MUST contain a valid SQL query
- The SQL query should SELECT DISTINCT userId FROM "Event" WHERE [conditions]
- Do NOT put natural language descriptions in the criteria field
- Always generate proper SQL that can be executed against the Event table
- Use proper date functions for time-based queries (e.g., NOW() - INTERVAL '7 days')

SQL QUERY RULES:
- You can use Common Table Expressions (CTEs) with WITH clauses
- You can use EXCEPT, INTERSECT, and UNION operations
- Always ensure queries are safe and efficient for large datasets
- Use LIMIT clauses for large result sets`;

    // Filter out null/undefined messages from conversation history
    const validConversationHistory = conversationHistory
      .filter((msg: any) => msg && typeof msg === 'object' && msg.role && msg.content)
      .map((msg: any) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content as string
      }));

    // Get response from OpenAI with function calling
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        ...validConversationHistory,
        { role: "user", content: message }
      ],
      functions: functions,
      function_call: "auto",
      temperature: 0.7,
      max_tokens: 1000,
    });

    const responseMessage = completion.choices[0]?.message;
    const functionCall = responseMessage?.function_call;

    if (functionCall) {
      // Handle function calls
      const functionName = functionCall.name;
      const functionArgs = JSON.parse(functionCall.arguments);

      let result;
      let responseType = 'function_result';

      switch (functionName) {
                case 'execute_analytics_query':
          try {
            const queryResults = await executeSafeQuery(functionArgs.sql_query, undefined, session.userId);
            
            // Check if this query could be useful for creating a segment
            // Handle both quoted and unquoted column names, case insensitive
            const upperQuery = functionArgs.sql_query.toUpperCase();
            const canCreateSegment = upperQuery.includes('SELECT DISTINCT "USERID"') || 
                                   upperQuery.includes('SELECT DISTINCT USERID') ||
                                   upperQuery.includes('SELECT "USERID"') ||
                                   upperQuery.includes('SELECT USERID');
            
            console.log('Segment detection debug:', {
              query: functionArgs.sql_query,
              upperQuery: upperQuery,
              canCreateSegment: canCreateSegment,
              resultCount: queryResults.length,
              hasResults: queryResults.length > 0
            });
            
            const suggestedActions = functionArgs.suggested_actions || [];
            if (canCreateSegment && queryResults.length > 0) {
              suggestedActions.push('Create a user segment from this query');
            }
            
            result = {
              type: 'query_results',
              results: queryResults,
              description: functionArgs.description,
              suggested_actions: suggestedActions,
              query_type: functionArgs.query_type,
              sql_query: functionArgs.sql_query,
              can_create_segment: canCreateSegment && queryResults.length > 0
            };
          } catch (error) {
            result = {
              type: 'error',
              message: `Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              description: functionArgs.description,
              sql_query: functionArgs.sql_query
            };
          }
          break;

        case 'create_user_segment':
          result = {
            type: 'segment_created',
            segment: await createUserSegment(functionArgs, session.userId, session.orgId, true),
            description: functionArgs.description
          };
          break;

        case 'create_notification_campaign':
          result = {
            type: 'campaign_created',
            campaign: await createNotificationCampaign(functionArgs, session.userId, session.orgId),
            description: `Created campaign: ${functionArgs.campaign_name}`
          };
          break;

        case 'create_segment_from_query':
          try {
            const segmentData = {
              segment_name: functionArgs.segment_name,
              description: functionArgs.description,
              criteria: functionArgs.sql_query,
              estimated_count: functionArgs.estimated_count || 0
            };
            
            const segment = await createUserSegment(segmentData, session.userId, session.orgId, true);
            result = {
              type: 'segment_created',
              segment: segment,
              description: `Successfully created segment: ${segment.name}`
            };
          } catch (error) {
            result = {
              type: 'error',
              message: `Failed to create segment: ${error instanceof Error ? error.message : 'Unknown error'}`,
              description: functionArgs.description,
              sql_query: functionArgs.sql_query
            };
          }
          break;

        default:
          result = {
            type: 'error',
            message: 'Unknown function called'
          };
      }

      return NextResponse.json(result);
    } else {
      // Regular text response
      return NextResponse.json({
        type: 'text_response',
        content: responseMessage?.content || 'Sorry, I could not process your request.'
      });
    }

  } catch (error) {
    console.error('Error in analytics chat:', error);
    return NextResponse.json(
      { 
        type: 'error',
        message: 'Failed to process your request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 