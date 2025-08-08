// Store active connections for Server-Sent Events
const connections = new Map<string, ReadableStreamDefaultController>();

// Store captured requests for each user
const capturedRequests = new Map<string, any[]>();

// Performance optimization: Skip processing if no active connections
function hasActiveConnections(): boolean {
  return connections.size > 0;
}

// Function to capture and broadcast requests
export function captureRequest(request: any) {
  // Performance optimization: Skip all processing if no one is listening
  if (!hasActiveConnections()) {
    return;
  }

  const { userId, method, url, headers, body, queryParams, ipAddress, userAgent } = request;
  
  if (!userId) {
    return;
  }

  const requestData = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    method,
    url,
    headers: typeof headers === 'object' ? headers : Object.fromEntries(headers?.entries() || []),
    body: body ? (typeof body === 'string' ? JSON.parse(body) : body) : undefined,
    queryParams,
    userId,
    ipAddress,
    userAgent
  };

  // Store the request
  if (!capturedRequests.has(userId)) {
    capturedRequests.set(userId, []);
  }
  capturedRequests.get(userId)!.push(requestData);

  // Keep only last 100 requests per user
  const userRequests = capturedRequests.get(userId)!;
  if (userRequests.length > 100) {
    userRequests.splice(0, userRequests.length - 100);
  }

  // Broadcast to all connections monitoring this user
  let broadcastCount = 0;
  connections.forEach((controller, connectionId) => {
    if (connectionId.includes(`-${userId}-`)) {
      try {
        const message = `data: ${JSON.stringify(requestData)}\n\n`;
        controller.enqueue(new TextEncoder().encode(message));
        broadcastCount++;
      } catch (error) {
        console.error('Error broadcasting to connection:', error);
        // Remove broken connection
        connections.delete(connectionId);
      }
    }
  });
}

// Function to add a new SSE connection
export function addConnection(connectionId: string, controller: ReadableStreamDefaultController) {
  connections.set(connectionId, controller);
}

// Function to remove an SSE connection
export function removeConnection(connectionId: string) {
  connections.delete(connectionId);
}

// Function to get captured requests for a user
export function getCapturedRequests(userId: string) {
  return capturedRequests.get(userId) || [];
}

// Function to clear captured requests for a user
export function clearCapturedRequests(userId: string) {
  capturedRequests.delete(userId);
}

// Function to get all active connections
export function getActiveConnections() {
  return Array.from(connections.keys());
}

// Function to get connection count
export function getConnectionCount() {
  return connections.size;
}

// Function to get debug system status (for monitoring)
export function getDebugSystemStatus() {
  return {
    activeConnections: connections.size,
    capturedRequestsCount: Array.from(capturedRequests.values()).reduce((total, requests) => total + requests.length, 0),
    isActive: connections.size > 0,
    memoryUsage: {
      connections: connections.size,
      capturedRequests: capturedRequests.size,
      totalRequests: Array.from(capturedRequests.values()).reduce((total, requests) => total + requests.length, 0)
    }
  };
} 