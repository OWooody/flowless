declare module 'swagger-jsdoc' {
  interface Options {
    definition: {
      openapi: string;
      info: {
        title: string;
        version: string;
        description: string;
      };
      servers?: Array<{
        url: string;
        description: string;
      }>;
      components?: {
        securitySchemes?: {
          [key: string]: {
            type: string;
            scheme: string;
            bearerFormat?: string;
          };
        };
      };
      security?: Array<{
        [key: string]: string[];
      }>;
    };
    apis: string[];
  }

  function swaggerJsdoc(options: Options): any;
  export = swaggerJsdoc;
}
 