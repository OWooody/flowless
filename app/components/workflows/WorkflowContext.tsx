'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface WorkflowContextType {
  previousNodeOutputs: Record<string, any>;
  setPreviousNodeOutputs: (outputs: Record<string, any>) => void;
  addNodeOutput: (nodeId: string, output: any) => void;
  clearNodeOutputs: () => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const useWorkflowContext = () => {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflowContext must be used within a WorkflowProvider');
  }
  return context;
};

interface WorkflowProviderProps {
  children: ReactNode;
}

export const WorkflowProvider: React.FC<WorkflowProviderProps> = ({ children }) => {
  const [previousNodeOutputs, setPreviousNodeOutputs] = useState<Record<string, any>>({});

  const addNodeOutput = (nodeId: string, output: any) => {
    setPreviousNodeOutputs(prev => ({
      ...prev,
      [nodeId]: output
    }));
  };

  const clearNodeOutputs = () => {
    setPreviousNodeOutputs({});
  };

  return (
    <WorkflowContext.Provider value={{
      previousNodeOutputs,
      setPreviousNodeOutputs,
      addNodeOutput,
      clearNodeOutputs
    }}>
      {children}
    </WorkflowContext.Provider>
  );
};
