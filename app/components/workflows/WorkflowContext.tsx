'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';

interface WorkflowContextType {
  previousNodeOutputs: Record<string, any>;
  setPreviousNodeOutputs: (outputs: Record<string, any>) => void;
  addNodeOutput: (nodeId: string, nodeName: string, output: any) => void;
  removeNodeOutput: (nodeId: string, oldNodeName?: string) => void;
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
  const [nodeIdToName, setNodeIdToName] = useState<Record<string, string>>({});
  const nodeIdToNameRef = useRef<Record<string, string>>({});

  // Keep the ref in sync with the state
  useEffect(() => {
    nodeIdToNameRef.current = nodeIdToName;
  }, [nodeIdToName]);

  const addNodeOutput = (nodeId: string, nodeName: string, output: any) => {
    const sanitizedName = sanitizeNodeName(nodeName);
    
    setPreviousNodeOutputs(prev => {
      // Get the current node ID to name mapping from the ref
      const oldNodeName = nodeIdToNameRef.current[nodeId];
      const oldSanitizedName = oldNodeName ? sanitizeNodeName(oldNodeName) : null;
      
      // Remove the old entry if it exists and is different
      const cleanedPrev = oldSanitizedName && oldSanitizedName !== sanitizedName 
        ? { ...prev }
        : prev;
      
      if (oldSanitizedName && oldSanitizedName !== sanitizedName) {
        delete cleanedPrev[oldSanitizedName];
      }
      
      // Store the new output
      if (typeof output === 'object' && output !== null && !Array.isArray(output)) {
        return {
          ...cleanedPrev,
          [sanitizedName]: output
        };
      } else {
        return {
          ...cleanedPrev,
          [sanitizedName]: output
        };
      }
    });
    
    // Update the node ID to name mapping
    setNodeIdToName(prev => ({
      ...prev,
      [nodeId]: nodeName
    }));
  };

  const removeNodeOutput = (nodeId: string) => {
    const nodeName = nodeIdToNameRef.current[nodeId];
    if (nodeName) {
      const sanitizedName = sanitizeNodeName(nodeName);
      setPreviousNodeOutputs(prev => {
        const { [sanitizedName]: _, ...rest } = prev;
        return rest;
      });
      
      // Remove from the mapping
      setNodeIdToName(prev => {
        const { [nodeId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const clearNodeOutputs = () => {
    setPreviousNodeOutputs({});
    setNodeIdToName({});
  };

  return (
    <WorkflowContext.Provider value={{
      previousNodeOutputs,
      setPreviousNodeOutputs,
      addNodeOutput,
      removeNodeOutput,
      clearNodeOutputs,
      validateNodeName,
      sanitizeNodeName
    }}>
      {children}
    </WorkflowContext.Provider>
  );
};
