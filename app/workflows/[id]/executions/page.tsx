'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface WorkflowExecution {
  id: string;
  workflowId: string;
  eventId?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  triggerEvent?: any;
  totalDurationMs?: number;
  memoryUsageMb?: number;
  databaseQueriesCount?: number;
  errorDetails?: any;
  results?: any;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  steps: WorkflowStep[];
}

interface WorkflowStep {
  id: string;
  executionId: string;
  stepOrder: number;
  stepType: 'trigger_validation' | 'action_execution' | 'data_processing';
  stepName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime: string;
  endTime?: string;
  durationMs?: number;
  inputData?: any;
  outputData?: any;
  errorMessage?: string;
  metadata?: any;
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
}

export default function WorkflowExecutionsPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;
  const executionDetailsRef = useRef<HTMLDivElement>(null);

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed' | 'running'>('all');

  useEffect(() => {
    loadWorkflowAndExecutions();
  }, [workflowId]);

  const loadWorkflowAndExecutions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load workflow details
      const workflowResponse = await fetch(`/api/workflows/${workflowId}`);
      if (!workflowResponse.ok) {
        throw new Error('Failed to load workflow');
      }
      const workflowData = await workflowResponse.json();
      setWorkflow(workflowData);

      // Load executions
      const executionsResponse = await fetch(`/api/workflows/${workflowId}/executions`);
      if (!executionsResponse.ok) {
        throw new Error('Failed to load executions');
      }
      const executionsData = await executionsResponse.json();
      setExecutions(executionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredExecutions = executions.filter(execution => {
    if (filter === 'all') return true;
    return execution.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'running': return 'text-blue-600 bg-blue-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStepTypeColor = (stepType: string) => {
    switch (stepType) {
      case 'trigger_validation': return 'text-purple-600 bg-purple-100';
      case 'action_execution': return 'text-blue-600 bg-blue-100';
      case 'data_processing': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleExecutionSelect = (execution: WorkflowExecution) => {
    setSelectedExecution(execution);
    
    // Scroll to execution details after a short delay to ensure the component has rendered
    setTimeout(() => {
      if (executionDetailsRef.current) {
        executionDetailsRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading execution history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadWorkflowAndExecutions}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/workflows')}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {workflow?.name} - Execution History
                </h1>
                <p className="text-sm text-gray-600">
                  {workflow?.description || 'Workflow execution analytics and monitoring'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadWorkflowAndExecutions}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Executions</p>
                <p className="text-2xl font-semibold text-gray-900">{executions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Successful</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {executions.filter(e => e.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {executions.filter(e => e.status === 'failed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatDuration(
                    executions
                      .filter(e => e.totalDurationMs)
                      .reduce((acc, e) => acc + (e.totalDurationMs || 0), 0) / 
                      executions.filter(e => e.totalDurationMs).length
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Execution History</h2>
              <div className="flex space-x-2">
                {(['all', 'completed', 'failed', 'running'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      filter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Executions List */}
          <div className="divide-y divide-gray-200">
            {filteredExecutions.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No executions found</h3>
                <p className="text-gray-600">
                  {filter === 'all' 
                    ? 'This workflow hasn\'t been executed yet.'
                    : `No ${filter} executions found.`
                  }
                </p>
              </div>
            ) : (
              filteredExecutions.map((execution) => (
                <div
                  key={execution.id}
                  className={`px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedExecution?.id === execution.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                  onClick={() => handleExecutionSelect(execution)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(execution.status)}`}>
                        {execution.status}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Execution {execution.id.slice(-8)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Started {formatDateTime(execution.startedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Duration: {formatDuration(execution.totalDurationMs)}</span>
                      <span>Steps: {execution.steps.length}</span>
                      {execution.completedAt && (
                        <span>Completed: {formatDateTime(execution.completedAt)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Execution Details */}
        {selectedExecution && (
          <div ref={executionDetailsRef} className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Execution Details - {selectedExecution.id.slice(-8)}
              </h3>
            </div>
            <div className="p-6">
              {/* Execution Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Status</h4>
                  <div className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedExecution.status)}`}>
                    {selectedExecution.status}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Duration</h4>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDuration(selectedExecution.totalDurationMs)}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Steps</h4>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedExecution.steps.length} steps
                  </p>
                </div>
              </div>

              {/* Steps Timeline */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-4">Execution Steps</h4>
                <div className="space-y-4">
                  {selectedExecution.steps
                    .sort((a, b) => a.stepOrder - b.stepOrder)
                    .map((step) => (
                      <div key={step.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className={`px-2 py-1 text-xs font-medium rounded-full ${getStepTypeColor(step.stepType)}`}>
                              {step.stepType.replace('_', ' ')}
                            </div>
                            <h5 className="text-sm font-medium text-gray-900">{step.stepName}</h5>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Duration: {formatDuration(step.durationMs)}</span>
                            <div className={`px-2 py-1 rounded-full ${getStatusColor(step.status)}`}>
                              {step.status}
                            </div>
                          </div>
                        </div>
                        
                        {step.errorMessage && (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-800">
                              <strong>Error:</strong> {step.errorMessage}
                            </p>
                          </div>
                        )}

                        {(step.inputData || step.outputData) && (
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {step.inputData && (
                              <div>
                                <h6 className="text-xs font-medium text-gray-600 mb-1">Input Data</h6>
                                <pre className="text-xs bg-gray-50 p-2 rounded border overflow-auto max-h-32">
                                  {JSON.stringify(step.inputData, null, 2)}
                                </pre>
                              </div>
                            )}
                            {step.outputData && (
                              <div>
                                <h6 className="text-xs font-medium text-gray-600 mb-1">Output Data</h6>
                                <pre className="text-xs bg-gray-50 p-2 rounded border overflow-auto max-h-32">
                                  {JSON.stringify(step.outputData, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* Error Details */}
              {selectedExecution.errorMessage && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Execution Error</h4>
                  <p className="text-sm text-red-700">{selectedExecution.errorMessage}</p>
                  {selectedExecution.errorDetails && (
                    <pre className="mt-2 text-xs bg-red-100 p-2 rounded border overflow-auto max-h-32">
                      {JSON.stringify(selectedExecution.errorDetails, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 