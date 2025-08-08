import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { captureRequest } from './debug';

// Helper function to get client IP
function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return '';
}

// Helper function to extract query parameters
function getQueryParams(req: NextRequest): Record<string, string> {
  const url = new URL(req.url);
  const queryParams: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });
  return queryParams;
}



// Debug interceptor wrapper
export function withDebugCapture(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Get auth info
      const { userId } = getAuth(req);
      
      // Capture request details (without body to avoid conflicts)
      if (userId) {
        const queryParams = getQueryParams(req);
        const ipAddress = getClientIp(req);
        const userAgent = req.headers.get('user-agent') || '';

        captureRequest({
          userId,
          method: req.method,
          url: req.url,
          headers: Object.fromEntries(req.headers.entries()),
          body: { _note: 'Body not captured in wrapper to avoid conflicts' },
          queryParams,
          ipAddress,
          userAgent
        });
      }

      // Call the original handler
      return await handler(req);
    } catch (error) {
      console.error('Error in debug interceptor:', error);
      // Still call the original handler even if debug capture fails
      return await handler(req);
    }
  };
}

// Alternative: Manual capture function for use in existing routes
export function captureRequestManually(req: NextRequest, body?: any, targetUserId?: string) {
  try {
    // Skip capturing debug API requests to avoid self-capture
    if (req.url.includes('/api/debug/')) {
      return;
    }

    const { userId: authUserId } = getAuth(req);
    
    // Use the targetUserId if provided, otherwise use the authenticated user
    const userId = targetUserId || authUserId;
    
    if (!userId) return;

    const queryParams = getQueryParams(req);
    const ipAddress = getClientIp(req);
    const userAgent = req.headers.get('user-agent') || '';

    captureRequest({
      userId,
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
      body: body || { _note: 'Body not captured to avoid conflicts' },
      queryParams,
      ipAddress,
      userAgent
    });
  } catch (error) {
    // Silent fail in production - don't log errors if debug is not being used
    if (process.env.NODE_ENV === 'development') {
      console.error('Error capturing request manually:', error);
    }
  }
} 