import axios from "axios";

interface ValidationFieldError {
  field: string;
  message: string;
}

// Represents the structure of your backend's API error response
interface ApiRawErrorResponse {
  status: string;
  message?: string; // For common errors like "User already exists"
  error?: ValidationFieldError[]; // For detailed validation errors as an array
}

export interface ParsedApiError {
  userMessage: string;
  type: 'validation' | 'common' | 'network' | 'client' | 'unknown';
  validationErrors?: ValidationFieldError[];
  originalError: unknown;
  statusCode?: number;
  axiosErrorCode?: string;
}

/**
 * Parses a raw error object (e.g., from an API call, potentially an AxiosError)
 * into a structured, user-friendly format.
 * This function does NOT perform side effects (like showing toasts or logging).
 * @param error The raw error object caught from a try...catch block.
 * @returns A ParsedApiError object containing the user-friendly message and other details.
 */
export function parseApiError(error: unknown): ParsedApiError {
  let userMessage: string = "An unexpected error occurred. Please try again.";
  let type: ParsedApiError['type'] = 'unknown';
  let validationErrors: ValidationFieldError[] | undefined;
  let statusCode: number | undefined;
  let axiosErrorCode: string | undefined;

  if (axios.isAxiosError(error)) {
    axiosErrorCode = error.code;

    if (error.response) {
      // This means the server responded with an error status (4xx, 5xx)
      const apiResponseData: ApiRawErrorResponse = error.response.data;
      statusCode = error.response.status;

      // Prioritize specific validation errors if they exist and are an array
      if (Array.isArray(apiResponseData.error) && apiResponseData.error.length > 0) {
        type = 'validation';
        validationErrors = apiResponseData.error;
        // Join multiple validation messages for a single, comprehensive string for generic display
        userMessage = apiResponseData.error.map(err => err.message).join("\n");
        // Fallback if for some reason the array was empty but 'error' property existed
        if (userMessage.length === 0 && typeof apiResponseData.message === 'string') {
          userMessage = apiResponseData.message;
        } else if (userMessage.length === 0) {
          userMessage = "Validation failed with no specific error messages provided.";
        }
      }

      // Fallback to the top-level 'message' property if available (e.g., "User already exists")
      else if (typeof apiResponseData.message === 'string' && apiResponseData.message.length > 0) {
        type = 'common';
        userMessage = apiResponseData.message;
      }

      // If it's an API error, but its structure doesn't match expected patterns
      else {
        type = 'unknown'; // Axios error with response, but unexpected data structure
        userMessage = apiResponseData.message || `An unknown API error occurred with status ${statusCode}.`;
      }
    } else if (error.request) {
      // The request was made but no response was received (e.g., network issues, CORS, timeout)
      type = 'network';
      userMessage = error.message === 'Network Error' // Axios's default network error message
        ? "A network error occurred. Please check your internet connection."
        : error.message || "The server could not be reached. Please try again later.";
    } else {
      // Something happened in setting up the request that triggered an Error (client-side Axios error)
      type = 'client';
      userMessage = error.message || "An unexpected client-side error occurred during the request setup.";
    }
  } else if (error instanceof Error) {
    // A generic JavaScript Error object (e.g., a bug in client-side code, not an API/network issue)
    type = 'client';
    userMessage = error.message || "An unexpected client-side error occurred.";
  }
  // If 'error' is not an Error object, it remains the default message and 'unknown' type.

  return {
    userMessage,
    type,
    validationErrors,
    originalError: error,
    statusCode,
    axiosErrorCode,
  };
}
