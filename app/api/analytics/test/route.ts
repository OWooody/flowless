import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

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
  }
];

// Query safety validation
function isQuerySafe(sql: string): boolean {
  const upperSql = sql.toUpperCase();
  
  // Check for dangerous keywords
  if (DANGEROUS_KEYWORDS.some(keyword => upperSql.includes(keyword))) {
    return false;
  }
  
  // Must start with SELECT
  if (!upperSql.trim().startsWith('SELECT')) {
    return false;
  }
  
  // No multiple statements
  if (upperSql.includes(';') && upperSql.split(';').length > 2) {
    return false;
  }
  
  return true;
}

// Execute safe query with timeout
async function executeSafeQuery(sql: string, timeoutMs: number = QUERY_TIMEOUT) {
  if (!isQuerySafe(sql)) {
    throw new Error('Query not allowed for security reasons');
  }
  
  // Add LIMIT if not present
  if (!sql.toUpperCase().includes('LIMIT')) {
    sql += ` LIMIT ${MAX_RESULTS}`;
  }
  
  // Execute with timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Query timeout')), timeoutMs);
  });
  
  const queryPromise = prisma.$queryRawUnsafe(sql);
  
  try {
    const results = await Promise.race([queryPromise, timeoutPromise]);
    
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

    return serializeResults(results);
  } catch (error) {
    if (error instanceof Error && error.message === 'Query timeout') {
      throw new Error('Query took too long to execute');
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
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
- userId (CamelCase), NOT userid (lowercase)
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

You can:
1. Execute safe SQL queries to analyze data
2. Create user segments based on behavior patterns
3. Suggest notification campaigns for user segments
4. Provide insights and recommendations

When users ask for data analysis, use the execute_analytics_query function.
IMPORTANT: Always use quoted table names in SQL queries: '"Event"' not 'Event' or 'event', '"Webhook"' not 'Webhook' or 'webhook'.

Always ensure queries are safe and efficient for large datasets.`;

    // Get response from OpenAI with function calling
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
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

      if (functionName === 'execute_analytics_query') {
        try {
          const queryResults = await executeSafeQuery(functionArgs.sql_query);
          const result = {
            type: 'query_results',
            results: queryResults,
            description: functionArgs.description,
            suggested_actions: functionArgs.suggested_actions || [],
            query_type: functionArgs.query_type,
            sql_query: functionArgs.sql_query
          };
          
          return NextResponse.json(result);
        } catch (error) {
          return NextResponse.json({
            type: 'error',
            message: `Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            description: functionArgs.description,
            sql_query: functionArgs.sql_query
          });
        }
      }
    } else {
      // Regular text response
      return NextResponse.json({
        type: 'text_response',
        content: responseMessage?.content || 'Sorry, I could not process your request.'
      });
    }

  } catch (error) {
    console.error('Error in test analytics chat:', error);
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