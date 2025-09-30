// 错误处理工具

// 错误类型定义
export interface AppError {
  code: string
  message: string
  details?: any
}

// 错误代码枚举
export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// 错误消息映射
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
  [ErrorCode.UNAUTHORIZED]: '未登录或登录已过期，请重新登录',
  [ErrorCode.FORBIDDEN]: '权限不足，无法执行此操作',
  [ErrorCode.NOT_FOUND]: '请求的资源不存在',
  [ErrorCode.VALIDATION_ERROR]: '输入数据格式错误',
  [ErrorCode.SERVER_ERROR]: '服务器内部错误，请稍后重试',
  [ErrorCode.UNKNOWN_ERROR]: '未知错误，请稍后重试'
}

/**
 * 处理API错误
 * @param error 错误对象
 * @returns 标准化的错误信息
 */
export function handleApiError(error: any): AppError {
  // 在非测试环境下记录错误
  if (process.env.NODE_ENV !== 'test') {
    console.error('API错误:', error)
  }

  // 网络错误
  if (!error.response) {
    return {
      code: ErrorCode.NETWORK_ERROR,
      message: ERROR_MESSAGES[ErrorCode.NETWORK_ERROR],
      details: error.message
    }
  }

  const { status, data } = error.response

  // 根据HTTP状态码处理错误
  switch (status) {
    case 401:
      return {
        code: ErrorCode.UNAUTHORIZED,
        message: data?.message || ERROR_MESSAGES[ErrorCode.UNAUTHORIZED],
        details: data
      }
    
    case 403:
      return {
        code: ErrorCode.FORBIDDEN,
        message: data?.message || ERROR_MESSAGES[ErrorCode.FORBIDDEN],
        details: data
      }
    
    case 404:
      return {
        code: ErrorCode.NOT_FOUND,
        message: data?.message || ERROR_MESSAGES[ErrorCode.NOT_FOUND],
        details: data
      }
    
    case 400:
      return {
        code: ErrorCode.VALIDATION_ERROR,
        message: data?.message || ERROR_MESSAGES[ErrorCode.VALIDATION_ERROR],
        details: data
      }
    
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        code: ErrorCode.SERVER_ERROR,
        message: data?.message || ERROR_MESSAGES[ErrorCode.SERVER_ERROR],
        details: data
      }
    
    default:
      return {
        code: ErrorCode.UNKNOWN_ERROR,
        message: data?.message || ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR],
        details: data
      }
  }
}

/**
 * 显示错误提示
 * @param error 错误对象
 */
export function showErrorMessage(error: AppError): void {
  // 这里可以集成具体的UI提示组件
  // 比如 toast、notification 等
  console.error(`[${error.code}] ${error.message}`)
  
  // 如果有全局的错误提示组件，可以在这里调用
  // 例如：toast.error(error.message)
}

/**
 * 创建安全的API调用包装器
 * @param apiCall API调用函数
 * @returns 包装后的API调用函数
 */
export function createSafeApiCall<T extends any[], R>(
  apiCall: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<{ data?: R; error?: AppError }> => {
    try {
      const data = await apiCall(...args)
      return { data }
    } catch (error) {
      const appError = handleApiError(error)
      return { error: appError }
    }
  }
}

/**
 * 重试机制
 * @param fn 要重试的函数
 * @param maxRetries 最大重试次数
 * @param delay 重试延迟（毫秒）
 * @returns Promise
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (i === maxRetries) {
        throw error
      }
      
      // 等待指定时间后重试
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }
  
  throw lastError
}

/**
 * 检查是否为网络错误
 * @param error 错误对象
 * @returns 是否为网络错误
 */
export function isNetworkError(error: any): boolean {
  return !error.response || error.code === 'NETWORK_ERROR'
}

/**
 * 检查是否为认证错误
 * @param error 错误对象
 * @returns 是否为认证错误
 */
export function isAuthError(error: any): boolean {
  return error.response?.status === 401 || error.code === ErrorCode.UNAUTHORIZED
}

/**
 * 检查是否为权限错误
 * @param error 错误对象
 * @returns 是否为权限错误
 */
export function isPermissionError(error: any): boolean {
  return error.response?.status === 403 || error.code === ErrorCode.FORBIDDEN
}