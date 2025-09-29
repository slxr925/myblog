// API响应处理工具

import type { ApiResponse } from '../types/api'
import { handleApiError, type AppError } from './error-handler'

/**
 * 统一的API响应结果类型
 */
export interface ApiResult<T> {
  success: boolean
  data?: T
  error?: AppError
  message?: string
}

/**
 * 处理API响应
 * @param apiCall API调用Promise
 * @returns 统一格式的响应结果
 */
export async function handleApiResponse<T>(
  apiCall: Promise<{ data: ApiResponse<T> }>
): Promise<ApiResult<T>> {
  try {
    const response = await apiCall
    const { data: apiResponse } = response
    
    // 检查业务状态码
    if (apiResponse.code === 200 || apiResponse.code === 0) {
      return {
        success: true,
        data: apiResponse.data,
        message: apiResponse.message
      }
    } else {
      // 业务错误
      return {
        success: false,
        error: {
          code: `BUSINESS_ERROR_${apiResponse.code}`,
          message: apiResponse.message || '业务处理失败',
          details: apiResponse
        },
        message: apiResponse.message
      }
    }
  } catch (error) {
    // 网络或其他错误
    const appError = handleApiError(error)
    return {
      success: false,
      error: appError,
      message: appError.message
    }
  }
}

/**
 * 处理分页API响应
 * @param apiCall API调用Promise
 * @returns 分页响应结果
 */
export async function handlePageApiResponse<T>(
  apiCall: Promise<{ data: ApiResponse<{ records: T[]; total: number; size: number; current: number; pages: number }> }>
): Promise<ApiResult<{ records: T[]; total: number; size: number; current: number; pages: number }>> {
  return handleApiResponse(apiCall)
}

/**
 * 处理列表API响应
 * @param apiCall API调用Promise
 * @returns 列表响应结果
 */
export async function handleListApiResponse<T>(
  apiCall: Promise<{ data: ApiResponse<T[]> }>
): Promise<ApiResult<T[]>> {
  return handleApiResponse(apiCall)
}

/**
 * 处理无返回数据的API响应
 * @param apiCall API调用Promise
 * @returns 响应结果
 */
export async function handleVoidApiResponse(
  apiCall: Promise<{ data: ApiResponse<void> }>
): Promise<ApiResult<void>> {
  return handleApiResponse(apiCall)
}

/**
 * 创建类型安全的API调用包装器
 * @param apiFunction API函数
 * @returns 包装后的API函数
 */
export function createApiWrapper<TArgs extends any[], TResponse>(
  apiFunction: (...args: TArgs) => Promise<{ data: ApiResponse<TResponse> }>
) {
  return async (...args: TArgs): Promise<ApiResult<TResponse>> => {
    return handleApiResponse(apiFunction(...args))
  }
}

/**
 * 批量处理API调用
 * @param apiCalls API调用数组
 * @returns 批量响应结果
 */
export async function handleBatchApiResponse<T>(
  apiCalls: Promise<{ data: ApiResponse<T> }>[]
): Promise<ApiResult<T>[]> {
  const results = await Promise.allSettled(apiCalls)
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      const apiResponse = result.value.data
      if (apiResponse.code === 200 || apiResponse.code === 0) {
        return {
          success: true,
          data: apiResponse.data,
          message: apiResponse.message
        }
      } else {
        return {
          success: false,
          error: {
            code: `BUSINESS_ERROR_${apiResponse.code}`,
            message: apiResponse.message || '业务处理失败',
            details: apiResponse
          },
          message: apiResponse.message
        }
      }
    } else {
      const appError = handleApiError(result.reason)
      return {
        success: false,
        error: appError,
        message: appError.message
      }
    }
  })
}

/**
 * 检查API结果是否成功
 * @param result API结果
 * @returns 是否成功
 */
export function isApiSuccess<T>(result: ApiResult<T>): result is ApiResult<T> & { success: true; data: T } {
  return result.success && result.data !== undefined
}

/**
 * 检查API结果是否失败
 * @param result API结果
 * @returns 是否失败
 */
export function isApiError<T>(result: ApiResult<T>): result is ApiResult<T> & { success: false; error: AppError } {
  return !result.success && result.error !== undefined
}

/**
 * 从API结果中提取数据，如果失败则返回默认值
 * @param result API结果
 * @param defaultValue 默认值
 * @returns 数据或默认值
 */
export function extractApiData<T>(result: ApiResult<T>, defaultValue: T): T {
  return isApiSuccess(result) ? result.data : defaultValue
}

/**
 * 从API结果中提取错误信息
 * @param result API结果
 * @returns 错误信息或null
 */
export function extractApiError<T>(result: ApiResult<T>): AppError | null {
  return isApiError(result) ? result.error : null
}