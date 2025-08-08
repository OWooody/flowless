import { clerkMiddleware, getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// Store for capturing requests
const requestCapture = new Map<string, any[]>();

// Function to capture request details
function captureRequest(req: NextRequest, userId?: string) {
  if (!userId) return;

  const url = new URL(req.url);
  const queryParams: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

  const requestData = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
    queryParams,
    userId,
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || req.ip || '',
    userAgent: req.headers.get('user-agent') || ''
  };

  // Store the request
  if (!requestCapture.has(userId)) {
    requestCapture.set(userId, []);
  }
  requestCapture.get(userId)!.push(requestData);

  // Keep only last 100 requests per user
  const userRequests = requestCapture.get(userId)!;
  if (userRequests.length > 100) {
    userRequests.splice(0, userRequests.length - 100);
  }

  // Broadcast to debug connections (this will be handled by the debug API)
  broadcastToDebugConnections(requestData);
}

// Function to broadcast to debug connections
function broadcastToDebugConnections(requestData: any) {
  // This will be implemented in the debug API
  // For now, we'll just log it
  console.log('Captured request:', {
    userId: requestData.userId,
    method: requestData.method,
    url: requestData.url,
    timestamp: requestData.timestamp
  });
}

// Export the capture function for use in API routes
export { captureRequest, requestCapture };

// Use Clerk middleware directly and capture requests in API routes instead
export default clerkMiddleware();

export const config = {
  // Protects all routes, including api/trpc
  // Update this if you want to exclude some routes
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
    "/((?!api/auth/jwt).*)"
  ],
}; 