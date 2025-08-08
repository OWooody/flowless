# Workflow Sequencing Guide

This guide explains how workflow sequencing works and how to ensure your nodes are connected in the correct order.

## How Sequencing Works

### Flow-Based Sequencing
The workflow system now uses **flow-based sequencing**, which means the execution order is determined by how you connect your nodes, not by the order you created them.

### The Algorithm
1. **Start from the trigger node**
2. **Follow the connections** from one node to the next
3. **Build the sequence** based on the actual flow
4. **Stop when** there are no more outgoing connections

## Example Workflows

### Linear Flow (Most Common)
```
[Trigger] → [Get Promo Code] → [Push Notification] → [WhatsApp]
```
**Execution Order:**
1. Trigger fires
2. Get Promo Code
3. Send Push Notification
4. Send WhatsApp Message

### Branching Flow
```
[Trigger] → [Get Promo Code] → [Push Notification]
                    ↓
              [WhatsApp Message]
```
**Execution Order:** (Takes the first branch)
1. Trigger fires
2. Get Promo Code
3. Send Push Notification
4. Send WhatsApp Message

### Complex Flow
```
[Trigger] → [Get Promo Code] → [Push Notification] → [Follow Up]
                    ↓
              [WhatsApp Message] → [SMS]
```
**Execution Order:** (Follows the main branch)
1. Trigger fires
2. Get Promo Code
3. Send Push Notification
4. Send Follow Up

## How to Ensure Correct Sequencing

### Step 1: Connect Nodes in Order
1. **Start with trigger node**
2. **Connect trigger to first action**
3. **Connect first action to second action**
4. **Continue until all actions are connected**

### Step 2: Verify Connections
- **Check that all nodes are connected** with lines
- **Ensure the flow follows your intended sequence**
- **No disconnected nodes** in your workflow

### Step 3: Test the Flow
1. **Save your workflow**
2. **Reload the workflow**
3. **Verify the sequence is correct**
4. **Check console logs** for the action sequence

## Console Debugging

When you load a workflow, you'll see console logs like this:
```
Loading workflow: {
  name: "My Workflow",
  nodes: 4,
  edges: 3,
  actions: 3,
  actionSequence: [
    "0: promo_code",
    "1: push_notification", 
    "2: whatsapp_message"
  ]
}
```

This shows you the exact sequence that will be executed.

## Common Issues and Solutions

### Issue: Nodes not in the sequence I created them

**Cause:** The system follows connections, not creation order

**Solution:** 
1. **Reconnect your nodes** in the desired order
2. **Start from trigger** and connect each action in sequence
3. **Verify the flow** by following the connecting lines

### Issue: Some nodes are missing from the sequence

**Cause:** Nodes might not be connected to the main flow

**Solution:**
1. **Check for disconnected nodes**
2. **Connect them to the main flow**
3. **Ensure all nodes have incoming and outgoing connections**

### Issue: Wrong execution order

**Cause:** Connections don't match your intended flow

**Solution:**
1. **Delete existing connections**
2. **Reconnect nodes** in the correct order
3. **Test the flow** by following the lines

## Best Practices

### 1. Plan Your Flow First
- **Sketch your workflow** on paper
- **Determine the execution order**
- **Identify dependencies** between actions

### 2. Connect Systematically
- **Start from the trigger**
- **Connect one action at a time**
- **Verify each connection** before moving to the next

### 3. Test Frequently
- **Save after each major change**
- **Reload to verify the sequence**
- **Check console logs** for confirmation

### 4. Use Clear Node Names
- **Give meaningful names** to your nodes
- **Use descriptive output variables**
- **Make the flow easy to follow**

## Example: Building a Welcome Workflow

### Step 1: Create Nodes
1. Add Trigger node
2. Add "Get Promo Code" node
3. Add "Push Notification" node
4. Add "WhatsApp Message" node

### Step 2: Connect in Sequence
1. **Connect Trigger → Get Promo Code**
2. **Connect Get Promo Code → Push Notification**
3. **Connect Push Notification → WhatsApp Message**

### Step 3: Verify Flow
```
[Trigger] → [Get Promo Code] → [Push Notification] → [WhatsApp]
```

### Step 4: Test
- Save the workflow
- Reload to verify
- Check console logs for sequence

## Advanced: Multiple Flows

For complex workflows with multiple paths:

### Parallel Flows
```
[Trigger] → [Get Promo Code] → [Push Notification]
                    ↓
              [WhatsApp Message]
```
**Note:** The system will follow the first connection from each node.

### Conditional Flows
```
[Trigger] → [Get Promo Code] → [Push Notification] → [Follow Up]
                    ↓
              [WhatsApp Message] → [SMS]
```
**Note:** The system will follow the main branch (first connection).

## Troubleshooting

### Check Console Logs
Open browser developer tools (F12) and look for:
```
Loading workflow: {
  actionSequence: ["0: promo_code", "1: push_notification", "2: whatsapp_message"]
}
```

### Verify Connections
- **All nodes should have connecting lines**
- **No floating nodes** without connections
- **Flow should be continuous** from trigger to end

### Test Simple Workflows First
- **Start with 2-3 nodes**
- **Verify the sequence works**
- **Then add complexity**

## Summary

The workflow system now uses **flow-based sequencing** that follows your actual connections, not the order you created nodes. This ensures that the execution order matches your intended flow exactly.

**Key Points:**
- ✅ Connect nodes in your desired sequence
- ✅ Follow the connecting lines to verify flow
- ✅ Check console logs for confirmation
- ✅ Test with simple workflows first 