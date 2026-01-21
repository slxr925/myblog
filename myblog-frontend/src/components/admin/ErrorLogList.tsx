import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { AlertCircle, Clock, User, Globe, Code, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../../utils/api';

export interface ErrorLog {
    errorId: string;
    timestamp: string;
    status: number;
    method: string;
    uri: string;
    errorType: string;
    message: string;
    ip: string;
    userId?: number;
    username?: string;
    userAgent?: string;
    stackTrace?: string;
}

interface ErrorLogListProps {
    limit?: number;
    autoRefresh?: boolean;
    refreshInterval?: number;
}

export const ErrorLogList: React.FC<ErrorLogListProps> = ({
    limit = 10,
    autoRefresh = true,
    refreshInterval = 30000
}) => {
    const [errors, setErrors] = useState<ErrorLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchErrors();

        if (autoRefresh) {
            const interval = setInterval(fetchErrors, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [limit, autoRefresh, refreshInterval]);

    const fetchErrors = async () => {
        try {
            const response = await api.admin.getRecentErrors(limit);
            setErrors(response || []);
            setLoading(false);
        } catch (error) {
            console.error('获取错误日志失败:', error);
            setLoading(false);
        }
    };

    const toggleExpand = (errorId: string) => {
        const newExpanded = new Set(expandedIds);
        if (newExpanded.has(errorId)) {
            newExpanded.delete(errorId);
        } else {
            newExpanded.add(errorId);
        }
        setExpandedIds(newExpanded);
    };

    const getStatusColor = (status: number) => {
        if (status >= 500) return 'text-red-600 bg-red-50 border-red-200';
        if (status >= 400) return 'text-orange-600 bg-orange-50 border-orange-200';
        return 'text-gray-600 bg-gray-50 border-gray-200';
    };

    const getMethodColor = (method: string) => {
        switch (method) {
            case 'GET': return 'text-blue-600 bg-blue-50';
            case 'POST': return 'text-green-600 bg-green-50';
            case 'PUT': return 'text-yellow-600 bg-yellow-50';
            case 'DELETE': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    加载中...
                </CardContent>
            </Card>
        );
    }

    if (errors.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        最近错误日志
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground py-8">
                    <div className="flex flex-col items-center gap-2">
                        <div className="text-4xl">🎉</div>
                        <div>暂无错误记录</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    最近错误日志
                    <span className="ml-auto text-xs font-normal text-muted-foreground">
                        最近 {errors.length} 条
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {errors.map((error) => {
                        const isExpanded = expandedIds.has(error.errorId);

                        return (
                            <div
                                key={error.errorId}
                                className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                            >
                                {/* 错误摘要 */}
                                <div
                                    className="p-3 cursor-pointer hover:bg-gray-50"
                                    onClick={() => toggleExpand(error.errorId)}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* 状态码 */}
                                        <div className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(error.status)}`}>
                                            {error.status}
                                        </div>

                                        {/* 主要信息 */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getMethodColor(error.method)}`}>
                                                    {error.method}
                                                </span>
                                                <code className="text-xs text-gray-700 truncate flex-1">
                                                    {error.uri}
                                                </code>
                                            </div>

                                            <div className="text-sm text-red-600 font-medium mb-1 line-clamp-2">
                                                {error.message || '未知错误'}
                                            </div>

                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {error.timestamp}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Globe className="w-3 h-3" />
                                                    {error.ip}
                                                </span>
                                                {error.userId && (
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        用户 #{error.userId}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Code className="w-3 h-3" />
                                                    {error.errorType}
                                                </span>
                                            </div>
                                        </div>

                                        {/* 展开/折叠按钮 */}
                                        <div className="text-gray-400">
                                            {isExpanded ? (
                                                <ChevronUp className="w-4 h-4" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 详细信息（可展开） */}
                                {isExpanded && (
                                    <div className="border-t bg-gray-50 p-3 space-y-3">
                                        {/* User Agent */}
                                        {error.userAgent && (
                                            <div>
                                                <div className="text-xs font-semibold text-gray-700 mb-1">
                                                    User Agent:
                                                </div>
                                                <div className="text-xs text-gray-600 font-mono bg-white p-2 rounded border">
                                                    {error.userAgent}
                                                </div>
                                            </div>
                                        )}

                                        {/* 堆栈跟踪 */}
                                        {error.stackTrace && (
                                            <div>
                                                <div className="text-xs font-semibold text-gray-700 mb-1">
                                                    堆栈跟踪:
                                                </div>
                                                <div className="text-xs text-gray-600 font-mono bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto max-h-48 overflow-y-auto">
                                                    <pre className="whitespace-pre-wrap">{error.stackTrace}</pre>
                                                </div>
                                            </div>
                                        )}

                                        {/* 错误ID */}
                                        <div className="text-xs text-gray-500">
                                            错误ID: <code className="bg-white px-1 py-0.5 rounded">{error.errorId}</code>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};
