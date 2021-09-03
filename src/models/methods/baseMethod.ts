export interface BaseRequest {
  [x: string]: unknown;
  id?: number | string;
  command: string;
  api_version?: number;
}

interface Warning {
  id: number;
  message: string;
  details?: { [key: string]: string };
}

export interface BaseResponse {
  id: number | string;
  status: "success" | "error" | string;
  type: "response" | string;
  result: unknown;
  warning?: "load";
  warnings?: Warning[];
  forwarded?: boolean;
  error?: string;
  error_message?: string;
  // TODO: type this better
  request?: unknown;
  api_version?: number;
}
