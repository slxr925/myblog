import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
    Activity, Cpu, Database, HardDrive, Zap, TrendingUp,
    Users, FileText, ThumbsUp, MessageSquare, Bell, Eye,
    Heart, Hash, Edit, Type, BarChart
} from 'lucide-react';
import { api } from '../../utils/api';

interface SystemMetrics {
    jvmMemoryUsed: number;
    jvmMemoryMax: number;
    jvmMemoryUsagePercentage: number;
    jvmThreadCount: number;
    jvmGcCount: number;
    jvmGcTime: number;
    cpuUsage: number;
    systemLoadAverage: number;
    dbConnectionActive: number;
    dbConnectionIdle: number;
    dbConnectionMax: number;
    redisConnections: number;
    redisMemoryUsed: number;
}

interface PerformanceMetrics {
    totalRequests: number;
    requestsPerSecond: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
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
    topTags: Array<{
        name: string;
        usageCount: number;
        percentage: number;
    }>;
    notification: {
        unreadCount: number;
        sentToday: number;
        openRate: number;
        kafkaBacklog: number;
    };
}

interface MonitoringDashboard {
    system: SystemMetrics;
    performance: PerformanceMetrics;
    business: BusinessMetrics;
}

export const MonitoringDashboard: React.FC = () => {
    const [data, setData] = useState<MonitoringDashboard | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // 5秒刷新
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const data = await api.admin.getMonitoringDashboard();
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

    const getStatusColor = (percentage: number) => {
        if (percentage > 80) return 'text-red-600';
        if (percentage > 60) return 'text-yellow-600';
        return 'text-green-600';
    };

    if (loading) {
        return <div className="text-center py-8">加载监控数据中...</div>;
    }

    if (error || !data) {
        return <div className="text-center py-8 text-red-600">{error || '数据加载失败'}</div>;
    }

    const { system, performance, business } = data;

    return (
        <div className="space-y-6">
            {/* 系统性能监控 */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    系统性能监控
                </h3>

                {/* 实时性能指标 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="w-5 h-5" />
                            实时性能
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-muted/30 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-muted-foreground">QPS</span>
                                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div className="text-2xl font-bold text-indigo-600">{performance.requestsPerSecond.toFixed(1)}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    总请求：{performance.totalRequests.toLocaleString()}
                                </div>
                            </div>

                            <div className="p-4 bg-muted/30 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-muted-foreground">平均响应时间</span>
                                    <Activity className="w-4 h-4 text-green-600" />
                                </div>
                                <div className="text-2xl font-bold text-green-600">{performance.averageResponseTime.toFixed(1)}ms</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    P95: {performance.p95ResponseTime.toFixed(1)}ms | P99: {performance.p99ResponseTime.toFixed(1)}ms
                                </div>
                            </div>

                            <div className="p-4 bg-muted/30 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-muted-foreground">错误率</span>
                                    <Activity className="w-4 h-4 text-red-600" />
                                </div>
                                <div className={`text-2xl font-bold ${getStatusColor(performance.errorRate)}`}>
                                    {performance.errorRate.toFixed(2)}%
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 系统资源 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* JVM 内存 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <HardDrive className="w-5 h-5" />
                                JVM 内存
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm">内存使用</span>
                                        <span className={`text-sm font-medium ${getStatusColor(system.jvmMemoryUsagePercentage)}`}>
                                            {system.jvmMemoryUsagePercentage.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div
                                            className="bg-indigo-600 h-2 rounded-full transition-all"
                                            style={{ width: `${system.jvmMemoryUsagePercentage}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                                        <span>{formatBytes(system.jvmMemoryUsed)}</span>
                                        <span>{formatBytes(system.jvmMemoryMax)}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <div className="text-sm text-muted-foreground">线程数</div>
                                        <div className="text-lg font-bold">{system.jvmThreadCount}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">GC 次数</div>
                                        <div className="text-lg font-bold">{system.jvmGcCount}</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* CPU */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Cpu className="w-5 h-5" />
                                CPU 使用率
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center h-32">
                                <div className="text-center">
                                    <div className={`text-5xl font-bold ${getStatusColor(system.cpuUsage)}`}>
                                        {system.cpuUsage.toFixed(1)}%
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-2">
                                        负载: {system.systemLoadAverage.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 数据库连接池 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="w-5 h-5" />
                                数据库连接池
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <div className="text-lg font-bold text-green-600">{system.dbConnectionActive}</div>
                                        <div className="text-xs text-muted-foreground">活跃</div>
                                    </div>
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <div className="text-lg font-bold text-blue-600">{system.dbConnectionIdle}</div>
                                        <div className="text-xs text-muted-foreground">空闲</div>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                                        <div className="text-lg font-bold">{system.dbConnectionMax}</div>
                                        <div className="text-xs text-muted-foreground">最大</div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm">连接池使用率</span>
                                        <span className="text-sm font-medium">
                                            {((system.dbConnectionActive / system.dbConnectionMax) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div
                                            className="bg-green-600 h-2 rounded-full transition-all"
                                            style={{ width: `${(system.dbConnectionActive / system.dbConnectionMax) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Redis */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="w-5 h-5 text-red-600" />
                                Redis 状态
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-muted-foreground">连接数</div>
                                    <div className="text-2xl font-bold">{system.redisConnections}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">内存使用</div>
                                    <div className="text-2xl font-bold">{formatBytes(system.redisMemoryUsed)}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* 业务数据监控 */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <BarChart className="w-5 h-5" />
                    业务数据监控
                </h3>

                {/* 内容概览 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            内容概览
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <MetricCard label="草稿" value={business.content.draftCount} icon={Edit} color="text-yellow-600" />
                            <MetricCard label="今日发布" value={business.content.publishedToday} icon={TrendingUp} color="text-green-600" />
                            <MetricCard label="总发布数" value={business.content.totalPublished} icon={FileText} color="text-blue-600" />
                            <MetricCard label="平均字数" value={business.content.avgWordCount?.toFixed(0)} icon={Type} color="text-purple-600" />
                            <MetricCard label="发布率" value={`${business.content.publishRate?.toFixed(1)}%`} icon={BarChart} color="text-indigo-600" />
                        </div>
                    </CardContent>
                </Card>

                {/* 用户活跃度 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            用户活跃度
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <ActiveUserCard label="当前在线" value={business.userActivity.onlineNow} badge="实时" />
                            <ActiveUserCard label="日活跃(DAU)" value={business.userActivity.dailyActiveUsers} />
                            <ActiveUserCard label="周活跃(WAU)" value={business.userActivity.weeklyActiveUsers} />
                            <ActiveUserCard label="月活跃(MAU)" value={business.userActivity.monthlyActiveUsers} />
                        </div>
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm text-muted-foreground">7日留存率</span>
                                <span className="text-sm font-medium text-green-600">
                                    {business.userActivity.retentionRate7d?.toFixed(1)}%
                                </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                                <div
                                    className="bg-green-600 h-2 rounded-full transition-all"
                                    style={{ width: `${business.userActivity.retentionRate7d}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 互动数据 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Heart className="w-5 h-5" />
                            互动数据
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InteractionCard
                                icon={ThumbsUp}
                                value={business.interaction.avgLikesPerBlog?.toFixed(1)}
                                label="平均点赞数/文"
                                color="pink"
                            />
                            <InteractionCard
                                icon={MessageSquare}
                                value={business.interaction.commentRate?.toFixed(1)}
                                label="评论率"
                                color="blue"
                            />
                            <InteractionCard
                                icon={Activity}
                                value={business.interaction.totalInteractions?.toLocaleString()}
                                label="总互动数"
                                color="purple"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* 热门内容 & 通知系统 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Top5文章 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                热门文章 Top5
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {business.topBlogs && business.topBlogs.length > 0 ? (
                                    business.topBlogs.map((blog, index) => (
                                        <div key={blog.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded">
                                            <div className={`text-lg font-bold ${index === 0 ? 'text-yellow-600' :
                                                index === 1 ? 'text-gray-400' :
                                                    index === 2 ? 'text-orange-600' :
                                                        'text-muted-foreground'
                                                }`}>
                                                #{index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium truncate">{blog.title}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    <Eye className="w-3 h-3 inline mr-1" />{blog.viewCount}
                                                    <ThumbsUp className="w-3 h-3 inline ml-2 mr-1" />{blog.likeCount}
                                                    <MessageSquare className="w-3 h-3 inline ml-2 mr-1" />{blog.commentCount}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-muted-foreground text-center py-4">暂无数据</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 通知系统 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="w-5 h-5" />
                                通知系统
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-muted-foreground">未读通知</div>
                                        <div className="text-2xl font-bold text-red-600">
                                            {business.notification.unreadCount?.toLocaleString()}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">今日发送</div>
                                        <div className="text-2xl font-bold">
                                            {business.notification.sentToday?.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-muted-foreground">通知打开率</span>
                                        <span className="text-sm font-medium text-green-600">
                                            {business.notification.openRate?.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div
                                            className="bg-green-600 h-2 rounded-full transition-all"
                                            style={{ width: `${business.notification.openRate}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

// 辅助组件
const MetricCard: React.FC<{ label: string; value: any; icon: React.ElementType; color: string }> = ({ label, value, icon: Icon, color }) => (
    <div className="p-4 bg-muted/30 rounded-xl">
        <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">{label}</span>
            <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
);

const ActiveUserCard: React.FC<{ label: string; value: number; badge?: string }> = ({ label, value, badge }) => (
    <div className="text-center p-4 bg-muted/30 rounded-xl">
        <div className="text-2xl font-bold text-indigo-600">{value?.toLocaleString()}</div>
        <div className="text-sm text-muted-foreground mt-1">{label}</div>
        {badge && (
            <div className="inline-block mt-2 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded text-xs text-green-600">
                {badge}
            </div>
        )}
    </div>
);

const InteractionCard: React.FC<{ icon: React.ElementType; value: string; label: string; color: string }> = ({ icon: Icon, value, label, color }) => {
    const colors = {
        pink: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600',
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600'
    };

    const bgColor = colors[color as keyof typeof colors] || colors.purple;
    const textColor = bgColor.split(' ').pop() || 'text-purple-600';

    return (
        <div className={`text-center p-4 rounded-xl ${bgColor}`}>
            <Icon className={`w-8 h-8 mx-auto mb-2 ${textColor}`} />
            <div className={`text-2xl font-bold ${textColor}`}>{value}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
        </div>
    );
};
