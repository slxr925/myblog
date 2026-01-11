import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Activity, Cpu, Database, HardDrive, TrendingUp, Users, Zap } from 'lucide-react';
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

export const ArthasSystemMonitor: React.FC = () => {
    const [metrics, setMetrics] = useState<ArthasSystemMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 5000); // 每5秒刷新
        return () => clearInterval(interval);
    }, []);

    const fetchMetrics = async () => {
        try {
            const data = await api.admin.getArthasSystemMetrics();
            setMetrics(data);
            setLoading(false);
        } catch (error) {
            console.error('获取Arthas系统指标失败:', error);
            setLoading(false);
        }
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    };

    const formatPercentage = (value: number): string => {
        return `${value.toFixed(1)}%`;
    };

    if (loading || !metrics) {
        return (
            <Card className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* JVM内存 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="font-semibold text-foreground">JVM内存</h3>
                    </div>
                </div>
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">使用率</span>
                            <span className="font-semibold text-foreground">
                                {formatPercentage(metrics.jvmMemoryUsagePercentage)}
                            </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all ${metrics.jvmMemoryUsagePercentage > 80
                                        ? 'bg-red-500'
                                        : metrics.jvmMemoryUsagePercentage > 60
                                            ? 'bg-yellow-500'
                                            : 'bg-blue-500'
                                    }`}
                                style={{ width: `${metrics.jvmMemoryUsagePercentage}%` }}
                            />
                        </div>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">已用</span>
                        <span className="font-medium">{formatBytes(metrics.jvmMemoryUsed)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">最大</span>
                        <span className="font-medium">{formatBytes(metrics.jvmMemoryMax)}</span>
                    </div>
                </div>
            </Card>

            {/* CPU使用率 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <Cpu className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="font-semibold text-foreground">CPU使用率</h3>
                    </div>
                </div>
                <div className="space-y-3">
                    <div>
                        <div className="text-3xl font-bold text-foreground mb-2">
                            {formatPercentage(metrics.cpuUsage)}
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all ${metrics.cpuUsage > 80
                                        ? 'bg-red-500'
                                        : metrics.cpuUsage > 60
                                            ? 'bg-yellow-500'
                                            : 'bg-green-500'
                                    }`}
                                style={{ width: `${Math.min(metrics.cpuUsage, 100)}%` }}
                            />
                        </div>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">系统负载</span>
                        <span className="font-medium">
                            {metrics.systemLoadAverage >= 0 ? metrics.systemLoadAverage.toFixed(2) : 'N/A'}
                        </span>
                    </div>
                </div>
            </Card>

            {/* 线程数 */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="font-semibold text-foreground">JVM线程</h3>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="text-3xl font-bold text-foreground">
                        {metrics.jvmThreadCount}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        活跃线程数
                    </div>
                </div>
            </Card>

            {/* GC信息（如果有） */}
            {(metrics.gcCount !== undefined || metrics.gcTime !== undefined) && (
                <Card className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <h3 className="font-semibold text-foreground">垃圾回收</h3>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {metrics.gcCount !== undefined && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">GC次数</span>
                                <span className="font-medium">{metrics.gcCount}</span>
                            </div>
                        )}
                        {metrics.gcTime !== undefined && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">GC耗时</span>
                                <span className="font-medium">{metrics.gcTime.toFixed(0)} ms</span>
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
};
