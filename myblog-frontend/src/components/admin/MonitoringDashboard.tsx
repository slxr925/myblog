import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
    Activity, Cpu, Database, Zap, TrendingUp,
    Users, FileText, MessageSquare, Bell, BarChart
} from 'lucide-react';
import { api } from '../../utils/api';

interface ArthasSystemMetrics {
    jvmMemoryUsed: number;
    jvmMemoryMax: number;
    jvmMemoryUsagePercentage: number;
    jvmThreadCount: number;
    cpuUsage: number;
    systemLoadAverage: number;
    heapMemory?: {
        used: number;
        max: number;
        usagePercentage: number;
    };
    gcCount?: number;
    gcTime?: number;
}

interface BusinessMetrics {
    content: {
        draftCount: number;
        publishedToday: number;
        totalPublished: number;
        avgWordCount: number;
        publishRate: number;
    };
    userActivity: {
        dailyActiveUsers: number;
        weeklyActiveUsers: number;
        monthlyActiveUsers: number;
        retentionRate7d: number;
        onlineNow: number;
    };
    interaction: {
        commentRate: number;
        avgLikesPerBlog: number;
        engagementRate: number;
        totalInteractions: number;
    };
    topBlogs: Array<{
        id: number;
        title: string;
        viewCount: number;
        likeCount: number;
        commentCount: number;
    }>;
    notification: {
        unreadCount: number;
        sentToday: number;
        openRate: number;
        kafkaBacklog: number;
    };
}

interface PerformanceMetrics {
    totalRequests: number;
    requestsPerSecond: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
}

interface MonitoringDashboard {
    arthasMetrics: ArthasSystemMetrics;
    performanceMetrics: PerformanceMetrics;
    businessMetrics: BusinessMetrics;
}

export const MonitoringDashboard: React.FC = () => {
    const [data, setData] = useState<MonitoringDashboard | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const data = await api.admin.getArthasMonitoringDashboard();
            setData(data);
            setLoading(false);
            setError(null);
        } catch (error) {
            console.error('获取监控数据失败:', error);
            setError('获取监控数据失败');
            setLoading(false);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    };

    const formatPercentage = (value: number): string => {
        return `${value.toFixed(1)}%`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error || !data) {
        return <div className="text-center py-8 text-red-600">{error || '数据加载失败'}</div>;
    }

    const { arthasMetrics, performanceMetrics: performance, businessMetrics: business } = data;

    return (
        <div className="space-y-6">
            {/* 系统性能监控 - Arthas增强 */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    系统性能监控
                    <span className="text-xs text-muted-foreground ml-2">Powered by Arthas</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* JVM内存 */}
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-sm">
                                <Database className="w-4 h-4 text-blue-600" />
                                JVM内存
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="text-2xl font-bold text-foreground">
                                    {formatPercentage(arthasMetrics.jvmMemoryUsagePercentage)}
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all ${arthasMetrics.jvmMemoryUsagePercentage > 80
                                            ? 'bg-red-500'
                                            : arthasMetrics.jvmMemoryUsagePercentage > 60
                                                ? 'bg-yellow-500'
                                                : 'bg-blue-500'
                                            }`}
                                        style={{ width: `${arthasMetrics.jvmMemoryUsagePercentage}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{formatBytes(arthasMetrics.jvmMemoryUsed)}</span>
                                    <span>{formatBytes(arthasMetrics.jvmMemoryMax)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* CPU使用率 */}
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-sm">
                                <Cpu className="w-4 h-4 text-green-600" />
                                CPU使用率
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="text-2xl font-bold text-foreground">
                                    {formatPercentage(arthasMetrics.cpuUsage)}
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all ${arthasMetrics.cpuUsage > 80
                                            ? 'bg-red-500'
                                            : arthasMetrics.cpuUsage > 60
                                                ? 'bg-yellow-500'
                                                : 'bg-green-500'
                                            }`}
                                        style={{ width: `${Math.min(arthasMetrics.cpuUsage, 100)}%` }}
                                    />
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    系统负载: {arthasMetrics.systemLoadAverage >= 0 ? arthasMetrics.systemLoadAverage.toFixed(2) : 'N/A'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* JVM线程 */}
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-sm">
                                <Activity className="w-4 h-4 text-purple-600" />
                                JVM线程
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground mb-2">
                                {arthasMetrics.jvmThreadCount}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                活跃线程数
                            </div>
                        </CardContent>
                    </Card>

                    {/* GC信息 */}
                    {(arthasMetrics.gcCount !== undefined || arthasMetrics.gcTime !== undefined) && (
                        <Card className="hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-sm">
                                    <Zap className="w-4 h-4 text-orange-600" />
                                    垃圾回收
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1">
                                    {arthasMetrics.gcCount !== undefined && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">GC次数</span>
                                            <span className="font-medium">{arthasMetrics.gcCount}</span>
                                        </div>
                                    )}
                                    {arthasMetrics.gcTime !== undefined && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">GC耗时</span>
                                            <span className="font-medium">{arthasMetrics.gcTime.toFixed(0)} ms</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* 性能指标 */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    性能指标
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">请求QPS</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">
                                {performance.requestsPerSecond.toFixed(1)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                总请求: {performance.totalRequests.toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">平均响应</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">
                                {performance.averageResponseTime.toFixed(0)} ms
                            </div>
                            <div className="text-xs text-muted-foreground">
                                平均响应时间
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">P95 / P99</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold text-foreground">
                                {performance.p95ResponseTime.toFixed(0)} / {performance.p99ResponseTime.toFixed(0)} ms
                            </div>
                            <div className="text-xs text-muted-foreground">
                                响应时间百分位
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">错误率</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${performance.errorRate > 1 ? 'text-red-600' : 'text-green-600'}`}>
                                {performance.errorRate.toFixed(2)}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {performance.errorRate > 1 ? '需要关注' : '运行正常'}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* 业务数据 */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <BarChart className="w-5 h-5" />
                    业务数据
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-blue-600 mb-2">
                                <Users className="w-4 h-4" />
                                <span className="text-sm font-medium">日活跃</span>
                            </div>
                            <div className="text-2xl font-bold">{business.userActivity.dailyActiveUsers}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                                周活跃: {business.userActivity.weeklyActiveUsers}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-green-600 mb-2">
                                <FileText className="w-4 h-4" />
                                <span className="text-sm font-medium">今日发布</span>
                            </div>
                            <div className="text-2xl font-bold">{business.content.publishedToday}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                                总发布: {business.content.totalPublished}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-purple-600 mb-2">
                                <MessageSquare className="w-4 h-4" />
                                <span className="text-sm font-medium">互动总数</span>
                            </div>
                            <div className="text-2xl font-bold">{business.interaction.totalInteractions}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                                互动率: {business.interaction.engagementRate.toFixed(1)}%
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-orange-600 mb-2">
                                <Bell className="w-4 h-4" />
                                <span className="text-sm font-medium">未读通知</span>
                            </div>
                            <div className="text-2xl font-bold">{business.notification.unreadCount}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                                今日发送: {business.notification.sentToday}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
