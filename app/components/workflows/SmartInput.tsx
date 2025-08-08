import React, { useState, useRef, useEffect } from 'react';
import DataPicker from './DataPicker';

interface SmartInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  executionData?: any;
  eventData?: any;
  workflowContext?: any;
  disabled?: boolean;
}

export default function SmartInput({
  value,
  onChange,
  placeholder,
  label,
  className = '',
  executionData,
  eventData,
  workflowContext,
  disabled = false
}: SmartInputProps) {
  const [isDataPickerOpen, setIsDataPickerOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local value with prop value
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(value);
    }
  }, [value, isEditing]);

  const handleDataSelect = (expression: string) => {
    const input = inputRef.current;
    if (!input) return;

    const cursorPosition = input.selectionStart || 0;
    const before = localValue.substring(0, cursorPosition);
    const after = localValue.substring(cursorPosition);
    const newValue = before + expression + after;
    
    setLocalValue(newValue);
    onChange(newValue);
    
    // Set cursor position after the inserted expression
    const newCursorPosition = cursorPosition + expression.length;
    
    // Use requestAnimationFrame for smoother cursor positioning
    requestAnimationFrame(() => {
      if (input) {
        input.focus();
        input.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    onChange(e.target.value);
  };

  const handleInputFocus = () => {
    setIsEditing(true);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
  };

  // Highlight variables in the input
  const renderInputValue = (inputValue: string) => {
    if (!inputValue) return '';
    
    // Split by variable pattern {{...}}
    const parts = inputValue.split(/(\{\{[^}]+\}\})/);
    
    return parts.map((part, index) => {
      if (part.match(/^\{\{[^}]+\}\}$/)) {
        // This is a variable - highlight it
        return (
          <span key={index} className="bg-blue-100 text-blue-800 px-1 rounded font-mono text-sm">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
        />
        
        {/* Data picker button */}
        <button
          type="button"
          onClick={() => setIsDataPickerOpen(true)}
          disabled={disabled}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          title="Select from execution data"
        >
          📊
        </button>
      </div>

      {/* Variable preview */}
      {localValue && (
        <div className="mt-1 text-xs text-gray-500">
          <span className="font-medium">Preview:</span>{' '}
          {renderInputValue(localValue)}
        </div>
      )}

      {/* Data Picker Modal */}
      <DataPicker
        isOpen={isDataPickerOpen}
        onClose={() => setIsDataPickerOpen(false)}
        onSelect={handleDataSelect}
        executionData={executionData}
        eventData={eventData}
        workflowContext={workflowContext}
      />
    </div>
  );
} 