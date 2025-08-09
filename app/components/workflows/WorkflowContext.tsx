'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface WorkflowContextType {
  previousNodeOutputs: Record<string, any>;
  setPreviousNodeOutputs: (outputs: Record<string, any>) => void;
  addNodeOutput: (nodeId: string, nodeName: string, output: any) => void;
  clearNodeOutputs: () => void;
  validateNodeName: (name: string, existingNames?: string[]) => { isValid: boolean; error?: string };
  sanitizeNodeName: (name: string) => string;
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

// Utility function to sanitize node names
const sanitizeNodeName = (name: string): string => {
  // Remove spaces and special characters, keep only alphanumeric and underscores
  return name
    .replace(/[^a-zA-Z0-9_]/g, '_') // Replace special characters with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .toLowerCase(); // Convert to lowercase
};

// Utility function to validate node names
const validateNodeName = (name: string, existingNames: string[] = []): { isValid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Node name cannot be empty' };
  }

  if (name.length > 50) {
    return { isValid: false, error: 'Node name cannot exceed 50 characters' };
  }

  // Check for spaces and special characters
  if (/[^a-zA-Z0-9_]/.test(name)) {
    return { isValid: false, error: 'Node name can only contain letters, numbers, and underscores' };
  }

  // Check for uniqueness
  const sanitizedName = sanitizeNodeName(name);
  if (existingNames.includes(sanitizedName)) {
    return { isValid: false, error: 'Node name must be unique' };
  }

  return { isValid: true };
};

export const WorkflowProvider: React.FC<WorkflowProviderProps> = ({ children }) => {
  const [previousNodeOutputs, setPreviousNodeOutputs] = useState<Record<string, any>>({});

  const addNodeOutput = (nodeId: string, nodeName: string, output: any) => {
    setPreviousNodeOutputs(prev => {
      // Sanitize the node name
      const sanitizedName = sanitizeNodeName(nodeName);
      
      // If output is an object, spread its properties directly
      if (typeof output === 'object' && output !== null && !Array.isArray(output)) {
        return {
          ...prev,
          [sanitizedName]: output
        };
      } else {
        // If output is not an object, store it with the sanitized node name as key
        return {
          ...prev,
          [sanitizedName]: output
        };
      }
    });
  };

  const clearNodeOutputs = () => {
    setPreviousNodeOutputs({});
  };

  return (
    <WorkflowContext.Provider value={{
      previousNodeOutputs,
      setPreviousNodeOutputs,
      addNodeOutput,
      clearNodeOutputs,
      validateNodeName,
      sanitizeNodeName
    }}>
      {children}
    </WorkflowContext.Provider>
  );
};
