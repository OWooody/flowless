# Live Request Debugger

A real-time debugging system that allows you to monitor live API requests for specific user IDs. This system captures request details including headers, body, query parameters, and metadata, then streams them in real-time to the debug interface.

## Features

- 🔍 **Real-time monitoring**: Watch requests as they happen
- 👤 **User-specific filtering**: Monitor requests for specific user IDs
- 📊 **Detailed request info**: View headers, body, query params, IP, user agent
- 🎯 **Live streaming**: Uses Server-Sent Events (SSE) for real-time updates
- 🧹 **Request management**: Clear captured requests and manage connections
- 🔒 **Secure**: Requires authentication and only shows requests for monitored users

## How to Use

### 1. Access the Debug Page

Navigate to `/debug` in your application. You'll see a clean interface with:
- User ID input field
- Start/Stop listening controls
- Real-time request display
- Clear functionality

### 2. Start Monitoring

1. Enter the user ID you want to monitor
2. Click "Start Listening"
3. The system will establish a Server-Sent Events connection
4. You'll see a green indicator when actively listening

### 3. Generate Requests

While monitoring, make API requests from the target user's session. The debug system will capture:
- All HTTP methods (GET, POST, PUT, DELETE, etc.)
- Request headers
- Request body (JSON, form data, etc.)
- Query parameters
- IP address
- User agent
- Timestamp

### 4. View Captured Requests

Requests appear in real-time with:
- **Method badge**: Color-coded by HTTP method
- **URL**: The endpoint being called
- **Timestamp**: When the request was made
- **Expandable details**: Click "Show Details" to see full request info

## Technical Implementation

### Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Debug Page    │    │   Debug API      │    │  API Routes     │
│   (Frontend)    │◄──►│   (SSE Stream)   │◄──►│  (Interceptors) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Components

1. **Debug Page** (`/app/debug/page.tsx`)
   - React component with real-time UI
   - Server-Sent Events client
   - Request display and management

2. **Debug API** (`/app/api/debug/live/route.ts`)
   - Server-Sent Events endpoint
   - Connection management
   - Request broadcasting

3. **Debug Library** (`/app/lib/debug.ts`)
   - Core debug functionality
   - Request storage and broadcasting
   - Connection management

4. **Debug Interceptor** (`/app/lib/debug-interceptor.ts`)
   - Request capture utilities
   - API route integration helpers

### Request Capture

Requests are captured in two ways:

1. **Automatic Capture**: Add to existing API routes
   ```typescript
   import { captureRequestManually } from '../../lib/debug-interceptor';
   
   export async function POST(req: NextRequest) {
     // Capture request for debug
     await captureRequestManually(req);
     
     // ... rest of your handler
   }
   ```

2. **Wrapper Function**: Wrap entire handlers
   ```typescript
   import { withDebugCapture } from '../../lib/debug-interceptor';
   
   export const POST = withDebugCapture(async (req: NextRequest) => {
     // Your handler logic
   });
   ```

## Security Considerations

- **Authentication Required**: Only authenticated users can access debug features
- **User Isolation**: Users can only monitor requests for user IDs they specify
- **Request Limits**: Maximum 100 requests stored per user to prevent memory issues
- **Connection Cleanup**: Automatic cleanup of broken SSE connections

## Configuration

### Environment Variables

No additional environment variables are required. The system uses existing Clerk authentication.

### Customization

You can customize the debug system by modifying:

- **Request Storage**: Change the limit of stored requests per user
- **Capture Fields**: Modify which request details are captured
- **UI Styling**: Update the debug page appearance
- **Filtering**: Add additional filtering options

## Troubleshooting

### Common Issues

1. **No requests appearing**
   - Ensure the user ID is correct
   - Check that API routes have debug capture enabled
   - Verify the user is making authenticated requests

2. **Connection lost**
   - The SSE connection may have timed out
   - Click "Start Listening" again to reconnect
   - Check browser console for errors

3. **Performance issues**
   - Reduce the number of stored requests per user
   - Limit the number of concurrent debug sessions
   - Monitor memory usage

### Debug Mode

Enable additional logging by setting:
```typescript
// In debug.ts
const DEBUG_MODE = true;
```

## API Reference

### Debug Functions

```typescript
// Capture a request
captureRequest(requestData: RequestData): void

// Add SSE connection
addConnection(connectionId: string, controller: ReadableStreamDefaultController): void

// Remove SSE connection
removeConnection(connectionId: string): void

// Get captured requests for user
getCapturedRequests(userId: string): RequestData[]

// Clear captured requests for user
clearCapturedRequests(userId: string): void
```

### Request Data Structure

```typescript
interface RequestData {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  queryParams?: Record<string, string>;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}
```

## Testing

Use the provided test script to generate sample requests:

```bash
node test-debug-system.js
```

This will make test API calls that you can monitor in the debug interface.

## Future Enhancements

- [ ] Request filtering by method, URL pattern, or status code
- [ ] Request replay functionality
- [ ] Export captured requests to JSON/CSV
- [ ] Request timing and performance metrics
- [ ] Webhook integration for external monitoring
- [ ] Request comparison and diffing
- [ ] Custom alerting for specific request patterns 