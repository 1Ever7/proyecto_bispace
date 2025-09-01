export interface McpMessage {
  jsonrpc: '2.0';
  id?: string | number;
  method?: string;
  params?: any;
  result?: any;
  error?: McpError;
}

export interface McpError {
  code: number;
  message: string;
  data?: any;
}

export interface McpResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface McpRequest {
  method: string;
  params?: any;
}

export interface McpResponse {
  result?: any;
  error?: McpError;
}




export interface McpServerConfig {
  name: string;
  version: string;
  capabilities: {
    resources?: boolean;
    tools?: boolean;
    logging?: boolean;
  };
  host?: string;
  port?: number;
}

export interface ApiQueryParams {
  apiId: string;
  endpoint: string;
  params?: Record<string, any>;
  method?: string;
}

export interface ApiDiscoveryParams {
  query?: string;
  type?: string;
  limit?: number;
}


export interface McpSuccessResponse {
  jsonrpc: '2.0';
  id: string | number;
  result: any;
}

export interface McpErrorResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  error: McpError;
}

export type McpResponseMessage = McpSuccessResponse | McpErrorResponse;
