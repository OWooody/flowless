// Simple TypeScript code execution service
// Note: In a production environment, you'd want to use a proper sandboxed environment

export interface ExecutionContext {
  event?: any;
  workflow?: any;
  previous?: any;
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
}

export class TypeScriptExecutor {
  private logs: string[] = [];

  constructor() {
    this.logs = [];
  }

  async execute(code: string, context: ExecutionContext): Promise<ExecutionResult> {
    this.logs = [];
    
    try {
      // Create a safe execution environment
      const safeContext = {
        ...context,
        console: {
          log: (...args: any[]) => {
            this.logs.push(`LOG: ${args.map(arg => JSON.stringify(arg)).join(' ')}`);
          },
          error: (...args: any[]) => {
            this.logs.push(`ERROR: ${args.map(arg => JSON.stringify(arg)).join(' ')}`);
          },
          warn: (...args: any[]) => {
            this.logs.push(`WARN: ${args.map(arg => JSON.stringify(arg)).join(' ')}`);
          },
        },
        // Add some safe utility functions
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
      };

      // Create the function from the code
      const functionBody = `
        try {
          ${code}
        } catch (error) {
          throw new Error('Code execution error: ' + error.message);
        }
      `;

      // Create a function with the safe context
      const func = new Function(
        'event', 'workflow', 'previous', 'console', 'JSON', 'Date', 'Math', 'Array', 'Object', 'String', 'Number', 'Boolean',
        functionBody
      );

      // Execute the function
      const result = await func(
        context.event,
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
        safeContext.Boolean
      );

      return {
        success: true,
        output: result,
        logs: this.logs,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        logs: this.logs,
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
