export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly responseData?: any,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "ApiError";
  }

  static fromAxiosError(error: any): ApiError {
    const statusCode = error.response?.status || 500;
    const message =
      error.response?.data?.message || error.message || "Unknown API error";
    return new ApiError(message, statusCode, error.response?.data, error);
  }
}
