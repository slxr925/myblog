// 错误处理工具测试

import { describe, it, expect, vi } from 'vitest'
import { 
  handleApiError, 
  ErrorCode, 
  createSafeApiCall, 
  withRetry,
  isNetworkError,
  isAuthError,
  isPermissionError
} from '../error-handler'

describe('Error Handler', () => {
  describe('handleApiError', () => {
    it('should handle network error', () => {
      const networkError = {
        message: 'Network Error',
        code: 'NETWORK_ERROR'
      }
      
      const result = handleApiError(networkError)
      
      expect(result.code).toBe(ErrorCode.NETWORK_ERROR)
      expect(result.message).toContain('网络连接失败')
      expect(result.details).toBe(networkError.message)
    })

    it('should handle 401 unauthorized error', () => {
      const unauthorizedError = {
        response: {
          status: 401,
          data: {
            message: '未授权访问'
          }
        }
      }
      
      const result = handleApiError(unauthorizedError)
      
      expect(result.code).toBe(ErrorCode.UNAUTHORIZED)
      expect(result.message).toBe('未授权访问')
    })

    it('should handle 403 forbidden error', () => {
      const forbiddenError = {
        response: {
          status: 403,
          data: {
            message: '权限不足'
          }
        }
      }
      
      const result = handleApiError(forbiddenError)
      
      expect(result.code).toBe(ErrorCode.FORBIDDEN)
      expect(result.message).toBe('权限不足')
    })

    it('should handle 404 not found error', () => {
      const notFoundError = {
        response: {
          status: 404,
          data: {
            message: '资源不存在'
          }
        }
      }
      
      const result = handleApiError(notFoundError)
      
      expect(result.code).toBe(ErrorCode.NOT_FOUND)
      expect(result.message).toBe('资源不存在')
    })

    it('should handle 400 validation error', () => {
      const validationError = {
        response: {
          status: 400,
          data: {
            message: '参数验证失败'
          }
        }
      }
      
      const result = handleApiError(validationError)
      
      expect(result.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(result.message).toBe('参数验证失败')
    })

    it('should handle 500 server error', () => {
      const serverError = {
        response: {
          status: 500,
          data: {
            message: '服务器内部错误'
          }
        }
      }
      
      const result = handleApiError(serverError)
      
      expect(result.code).toBe(ErrorCode.SERVER_ERROR)
      expect(result.message).toBe('服务器内部错误')
    })

    it('should handle unknown error', () => {
      const unknownError = {
        response: {
          status: 418,
          data: {
            message: '我是茶壶'
          }
        }
      }
      
      const result = handleApiError(unknownError)
      
      expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR)
      expect(result.message).toBe('我是茶壶')
    })
  })

  describe('createSafeApiCall', () => {
    it('should return data on successful API call', async () => {
      const mockApiCall = vi.fn().mockResolvedValue('success data')
      const safeApiCall = createSafeApiCall(mockApiCall)
      
      const result = await safeApiCall('arg1', 'arg2')
      
      expect(result.data).toBe('success data')
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('should return error on failed API call', async () => {
      const mockError = new Error('API failed')
      const mockApiCall = vi.fn().mockRejectedValue(mockError)
      const safeApiCall = createSafeApiCall(mockApiCall)
      
      const result = await safeApiCall('arg1')
      
      expect(result.data).toBeUndefined()
      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe(ErrorCode.NETWORK_ERROR)
    })
  })

  describe('withRetry', () => {
    it('should succeed on first try', async () => {
      const mockFn = vi.fn().mockResolvedValue('success')
      
      const result = await withRetry(mockFn, 3, 100)
      
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success')
      
      const result = await withRetry(mockFn, 3, 10)
      
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(3)
    })

    it('should throw error after max retries', async () => {
      const mockError = new Error('persistent failure')
      const mockFn = vi.fn().mockRejectedValue(mockError)
      
      await expect(withRetry(mockFn, 2, 10)).rejects.toThrow('persistent failure')
      expect(mockFn).toHaveBeenCalledTimes(3) // initial + 2 retries
    })
  })

  describe('Error Type Checkers', () => {
    it('should identify network errors', () => {
      const networkError = { message: 'Network Error' }
      const httpError = { response: { status: 500 } }
      
      expect(isNetworkError(networkError)).toBe(true)
      expect(isNetworkError(httpError)).toBe(false)
    })

    it('should identify auth errors', () => {
      const authError = { response: { status: 401 } }
      const otherError = { response: { status: 500 } }
      
      expect(isAuthError(authError)).toBe(true)
      expect(isAuthError(otherError)).toBe(false)
    })

    it('should identify permission errors', () => {
      const permissionError = { response: { status: 403 } }
      const otherError = { response: { status: 500 } }
      
      expect(isPermissionError(permissionError)).toBe(true)
      expect(isPermissionError(otherError)).toBe(false)
    })
  })
})