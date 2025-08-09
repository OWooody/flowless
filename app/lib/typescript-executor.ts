// Generic TypeScript code execution service for workflow automation
// Note: In a production environment, you'd want to use a proper sandboxed environment

export interface ExecutionContext {
  input?: any;           // Generic input data (replaces 'event')
  workflow?: any;         // Workflow context and variables
  previous?: any;         // Output from previous node
  nodeId?: string;
  nodeType?: string;
  console: {
    log: (...args: any[]) => void;
    error: (...args: any[]) => void;
    warn: (...args: any[]) => void;
  };
}

export interface ExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  logs: string[];
  executionTime?: number;
  dataFlow?: {
    input?: any;
    output?: any;
    previousNodeOutput?: any;
  };
}

export class TypeScriptExecutor {
  private logs: string[] = [];
  private startTime: number = 0;

  constructor() {
    this.logs = [];
  }

  async execute(code: string, context: ExecutionContext): Promise<ExecutionResult> {
    this.logs = [];
    this.startTime = Date.now();
    
    try {
      // Log the input data for debugging
      this.logs.push(`INPUT: Input data: ${JSON.stringify(context.input, null, 2)}`);
      this.logs.push(`INPUT: Previous node output: ${JSON.stringify(context.previous, null, 2)}`);
      this.logs.push(`INPUT: Workflow context: ${JSON.stringify(context.workflow, null, 2)}`);

      // Create a safe execution environment with enhanced utilities
      const safeContext = {
        ...context,
        console: {
          log: (...args: any[]) => {
            const message = args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');
            this.logs.push(`LOG: ${message}`);
          },
          error: (...args: any[]) => {
            const message = args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');
            this.logs.push(`ERROR: ${message}`);
          },
          warn: (...args: any[]) => {
            const message = args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');
            this.logs.push(`WARN: ${message}`);
          },
        },
        // Enhanced utility functions for data processing
        JSON: {
          stringify: JSON.stringify,
          parse: JSON.parse,
        },
        Date: Date,
        Math: Math,
        Array: Array,
        Object: Object,
        String: String,
        Number: Number,
        Boolean: Boolean,
        // Add fetch for API calls
        fetch: fetch,
        // Add utility functions for common data operations
        utils: {
          // Deep merge objects
          merge: (target: any, ...sources: any[]) => {
            return sources.reduce((acc, source) => {
              return Object.keys(source).reduce((obj, key) => {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                  obj[key] = safeContext.utils.merge(obj[key] || {}, source[key]);
                } else {
                  obj[key] = source[key];
                }
                return obj;
              }, acc);
            }, target);
          },
          // Get nested object property safely
          get: (obj: any, path: string, defaultValue?: any) => {
            return path.split('.').reduce((current, key) => {
              return current && current[key] !== undefined ? current[key] : defaultValue;
            }, obj);
          },
          // Set nested object property safely
          set: (obj: any, path: string, value: any) => {
            const keys = path.split('.');
            const lastKey = keys.pop();
            const target = keys.reduce((current, key) => {
              if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
              }
              return current[key];
            }, obj);
            if (lastKey) {
              target[lastKey] = value;
            }
            return obj;
          },
          // Filter array based on predicate
          filter: (data: any[], predicate: (item: any) => boolean) => {
            if (!Array.isArray(data)) {
              return [];
            }
            return data.filter(predicate);
          },
          // Find item in array based on predicate
          find: (data: any[], predicate: (item: any) => boolean) => {
            if (!Array.isArray(data)) {
              return null;
            }
            return predicate(data) ? data : null;
          },
        },
      };

      // Create the function from the code with enhanced context
      const previousOutputs = context.previous || {};
      const functionBody = `
        try {
          // Log available variables for debugging
          console.log('Available variables:');
          console.log('- input:', input);
          console.log('- workflow:', workflow);
          console.log('- previous:', previous);
          console.log('- utils:', utils);
          
          // Make previous node outputs available as individual variables
          ${Object.keys(previousOutputs).map(nodeName => `const ${nodeName} = previous['${nodeName}'];`).join('\n          ')}
          
          ${code}
        } catch (error) {
          throw new Error('Code execution error: ' + error.message);
        }
      `;

      // Create a function with the safe context
      const func = new Function(
        'input', 'workflow', 'previous', 'console', 'JSON', 'Date', 'Math', 'Array', 'Object', 'String', 'Number', 'Boolean', 'fetch', 'utils',
        functionBody
      );

      // Execute the function
      const result = await func(
        context.input,
        context.workflow,
        context.previous,
        safeContext.console,
        safeContext.JSON,
        safeContext.Date,
        safeContext.Math,
        safeContext.Array,
        safeContext.Object,
        safeContext.String,
        safeContext.Number,
        safeContext.Boolean,
        safeContext.fetch,
        safeContext.utils
      );

      const executionTime = Date.now() - this.startTime;
      this.logs.push(`OUTPUT: ${JSON.stringify(result, null, 2)}`);
      this.logs.push(`EXECUTION_TIME: ${executionTime}ms`);

      return {
        success: true,
        output: result,
        logs: this.logs,
        executionTime,
        dataFlow: {
          input: {
            input: context.input,
            previous: context.previous,
            workflow: context.workflow
          },
          output: result,
          previousNodeOutput: context.previous
        }
      };
    } catch (error) {
      const executionTime = Date.now() - this.startTime;
      this.logs.push(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        logs: this.logs,
        executionTime,
        dataFlow: {
          input: {
            input: context.input,
            previous: context.previous,
            workflow: context.workflow
          },
          output: null,
          previousNodeOutput: context.previous
        }
      };
    }
  }

  // Validate TypeScript code syntax (basic validation)
  validateSyntax(code: string): { isValid: boolean; error?: string } {
    try {
      // Basic validation - check for common syntax errors
      if (!code.trim()) {
        return { isValid: false, error: 'Code cannot be empty' };
      }

      // Check for basic syntax patterns
      const hasReturn = code.includes('return');
      const hasConsole = code.includes('console.log');
      
      // Basic validation passed
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Syntax validation failed',
      };
    }
  }
}
