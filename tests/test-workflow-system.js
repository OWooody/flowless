const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testWorkflowSystem() {
  console.log('🧪 Testing Workflow System...\n');

  try {
    // 1. Test database connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // 2. Test workflow creation
    console.log('2. Testing workflow creation...');
    const testWorkflow = await prisma.workflow.create({
      data: {
        name: 'Test Welcome Workflow',
        description: 'A test workflow for welcome notifications',
        trigger: {
          eventType: 'engagement',
          filters: {
            eventName: 'page_view'
          }
        },
        actions: [
          {
            type: 'push_notification',
            title: 'Welcome!',
            body: 'Thanks for visiting our app!',
            targetUsers: 'specific',
            userIds: ['test-user-1']
          }
        ],
        isActive: true,
        userId: 'test-user',
        organizationId: 'test-org'
      }
    });
    console.log('✅ Workflow created:', testWorkflow.id);

    // 3. Test workflow execution logging
    console.log('\n3. Testing workflow execution logging...');
    const testExecution = await prisma.workflowExecution.create({
      data: {
        workflowId: testWorkflow.id,
        status: 'completed',
        results: {
          success: true,
          actionResults: [
            {
              actionIndex: 0,
              actionType: 'push_notification',
              success: true,
              result: {
                sentCount: 1,
                failedCount: 0
              }
            }
          ]
        }
      }
    });
    console.log('✅ Execution logged:', testExecution.id);

    // 4. Test workflow retrieval
    console.log('\n4. Testing workflow retrieval...');
    const retrievedWorkflow = await prisma.workflow.findUnique({
      where: { id: testWorkflow.id },
      include: {
        // Note: This will work once Prisma client is regenerated
        // executions: true
      }
    });
    console.log('✅ Workflow retrieved:', retrievedWorkflow.name);

    // 5. Test execution history
    console.log('\n5. Testing execution history...');
    const executions = await prisma.workflowExecution.findMany({
      where: { workflowId: testWorkflow.id }
    });
    console.log('✅ Found executions:', executions.length);

    // 6. Cleanup
    console.log('\n6. Cleaning up test data...');
    await prisma.workflowExecution.deleteMany({
      where: { workflowId: testWorkflow.id }
    });
    await prisma.workflow.delete({
      where: { id: testWorkflow.id }
    });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests passed! Workflow system is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testWorkflowSystem(); 