# Workflow Loading Troubleshooting Guide

This guide helps you troubleshoot issues when workflows with multiple nodes don't load correctly.

## Common Issues and Solutions

### Issue: Nodes appear disconnected after loading

**Symptoms:**
- Nodes are visible but not connected with lines
- Workflow appears broken or incomplete
- Can't see the flow between actions

**Solutions:**

1. **Check Browser Console**
   - Open browser developer tools (F12)
   - Look for any error messages
   - Check if there are console logs showing workflow loading

2. **Refresh the Page**
   - Sometimes React Flow needs a refresh to properly render edges
   - Try refreshing the browser page
   - Clear browser cache if needed

3. **Check Node Positions**
   - Nodes might be positioned outside the visible area
   - Use the zoom controls to see all nodes
   - Look for nodes that might be hidden

4. **Verify Workflow Data**
   - Check that the workflow was saved correctly
   - Ensure all actions are present in the database
   - Verify the workflow ID in the URL

### Issue: Only some nodes appear

**Symptoms:**
- Only trigger and first action are visible
- Missing subsequent actions
- Workflow appears incomplete

**Solutions:**

1. **Check Action Count**
   - Verify the workflow has multiple actions saved
   - Check the workflow list to see action count
   - Ensure all actions were saved properly

2. **Check Node Types**
   - Verify all action types are supported
   - Check for any unsupported action types
   - Ensure promo code nodes are properly configured

3. **Database Verification**
   - Check if the workflow data is complete in the database
   - Verify all actions are stored correctly
   - Check for any data corruption

### Issue: Nodes appear but are not connected

**Symptoms:**
- All nodes are visible
- No connecting lines between nodes
- Workflow appears as separate disconnected nodes

**Solutions:**

1. **Check Edge Creation**
   - Verify that edges are being created during loading
   - Check browser console for edge creation logs
   - Ensure edge IDs are unique

2. **React Flow Issues**
   - Try zooming in/out to refresh the view
   - Use the "Fit View" button to see all nodes
   - Check if edges are rendered but not visible

3. **Browser Compatibility**
   - Try a different browser
   - Clear browser cache and cookies
   - Disable browser extensions that might interfere

## Debugging Steps

### Step 1: Check Browser Console
1. Open browser developer tools (F12)
2. Go to the Console tab
3. Look for any error messages
4. Check for workflow loading logs

### Step 2: Verify Workflow Data
1. Go to the workflows list page
2. Check the workflow details
3. Verify the number of actions
4. Ensure the workflow is active

### Step 3: Test with Simple Workflow
1. Create a simple workflow with 2-3 nodes
2. Save and reload it
3. Check if the issue persists
4. If it works, the issue might be with complex workflows

### Step 4: Check Network Requests
1. Open browser developer tools
2. Go to the Network tab
3. Reload the workflow page
4. Check if the API request to load the workflow succeeds
5. Verify the response contains all actions

## Expected Behavior

### Correct Workflow Loading
When a workflow loads correctly, you should see:

1. **All Nodes Visible**
   - Trigger node (usually on the left)
   - All action nodes (arranged horizontally)
   - Each node properly positioned

2. **All Nodes Connected**
   - Lines connecting trigger to first action
   - Lines connecting each action to the next
   - No disconnected nodes

3. **Proper Node Types**
   - Trigger node with lightning bolt icon
   - Promo code nodes with ticket icon
   - Push notification nodes with bell icon
   - WhatsApp nodes with message icon

4. **Console Logs**
   - "Loading workflow:" message with details
   - Number of nodes and edges created
   - No error messages

### Example of Correct Loading
```
Loading workflow: {
  name: "Test Workflow",
  nodes: 4,
  edges: 3,
  actions: 3
}
```

## Common Workflow Structures

### Simple Workflow
```
[Trigger] → [Action]
```
- 2 nodes, 1 edge

### Multi-Action Workflow
```
[Trigger] → [Action 1] → [Action 2] → [Action 3]
```
- 4 nodes, 3 edges

### Promo Code Workflow
```
[Trigger] → [Get Promo Code] → [Push Notification] → [WhatsApp]
```
- 4 nodes, 3 edges

## Technical Details

### Edge Creation Logic
The system creates edges in this order:
1. Trigger → First Action
2. First Action → Second Action
3. Second Action → Third Action
4. And so on...

### Node Positioning
- Trigger: x=100, y=100
- Actions: x=400+(index*50), y=100+(index*150)
- Each action is positioned slightly to the right and below the previous

### Edge Types
- All edges use 'smoothstep' type
- Edge IDs follow pattern: `edge-{source}-to-{target}`
- Edges connect nodes in sequential order

## Reporting Issues

If you continue to experience issues:

1. **Collect Information**
   - Workflow name and ID
   - Number of actions in the workflow
   - Browser and version
   - Any error messages from console

2. **Test Steps**
   - Steps to reproduce the issue
   - What you expected to see
   - What you actually saw

3. **Screenshots**
   - Screenshot of the workflow builder
   - Screenshot of browser console
   - Screenshot of network requests

## Prevention Tips

1. **Save Frequently**
   - Save your workflow after adding each node
   - Don't leave unsaved changes for too long

2. **Test Simple Workflows First**
   - Start with 2-3 nodes
   - Verify it loads correctly
   - Then add more complexity

3. **Use Supported Node Types**
   - Stick to supported action types
   - Avoid experimental configurations

4. **Check Browser Compatibility**
   - Use modern browsers (Chrome, Firefox, Safari, Edge)
   - Keep browser updated
   - Clear cache regularly 