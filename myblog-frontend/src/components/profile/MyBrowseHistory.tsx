import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Eye, Heart, MessageCircle, Calendar, Tag as TagIcon } from 'lucide-react';
import { api } from '../../utils/api';
import type { BrowseHistoryVO } from '../../types/api';
import { Badge } from '../ui/badge';

/**
 * 浏览记录组件
 * 显示用户最近3天的文章浏览记录，按时间分组
 */
const MyBrowseHistory: React.FC = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState<BrowseHistoryVO[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBrowseHistory();
    }, []);

    const fetchBrowseHistory = async () => {
        try {
            setLoading(true);
            const data = await api.browseHistory.getUserHistory(3);
            setHistory(data);
        } catch (error) {
            console.error('获取浏览记录失败:', error);
        } finally {
            setLoading(false);
        }
    };

    // 根据时间分组
    const groupByDate = (records: BrowseHistoryVO[]) => {
        const groups: { [key: string]: BrowseHistoryVO[] } = {
            '今天': [],
            '昨天': [],
            '更早': []
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        records.forEach(record => {
            const browseDate = new Date(record.browseTime);
            browseDate.setHours(0, 0, 0, 0);

            if (browseDate.getTime() === today.getTime()) {
                groups['今天'].push(record);
            } else if (browseDate.getTime() === yesterday.getTime()) {
                groups['昨天'].push(record);
            } else {
                groups['更早'].push(record);
            }
        });

        return groups;
    };

    const formatTime = (timeStr: string) => {
        try {
            const date = new Date(timeStr);
            return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        } catch {
            return timeStr;
        }
    };

    const groupedHistory = groupByDate(history);

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-muted/30 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="text-center py-20">
                <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">暂无浏览记录</h3>
                <p className="text-muted-foreground">开始浏览文章，记录将显示在这里</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {Object.entries(groupedHistory).map(([groupName, records]) => {
                if (records.length === 0) return null;

                return (
                    <div key={groupName}>
                        <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {groupName}
                            <span className="text-xs">({records.length}篇)</span>
                        </h3>

                        <div className="space-y-3">
                            {records.map((record, index) => (
                                <motion.div
                                    key={record.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => navigate(`/blog/${record.blogId}`)}
                                    className="group bg-card rounded-xl p-4 border border-border hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-pointer"
                                >
                                    <div className="flex gap-4">
                                        {/* 封面图 */}
                                        {record.coverImg && (
                                            <div className="w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                                                <img
                                                    src={record.coverImg}
                                                    alt={record.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                        )}

                                        {/* 内容 */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-2">
                                                {record.title}
                                            </h4>

                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                                {record.summary}
                                            </p>

                                            {/* 标签和分类 */}
                                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                                                {record.categoryName && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {record.categoryName}
                                                    </Badge>
                                                )}
                                                {record.tags && record.tags.slice(0, 3).map((tag, idx) => (
                                                    <Badge key={idx} variant="outline" className="text-xs">
                                                        <TagIcon className="w-3 h-3 mr-1" />
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>

                                            {/* 统计信息 */}
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatTime(record.browseTime)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Eye className="w-3 h-3" />
                                                    {record.viewCount}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Heart className="w-3 h-3" />
                                                    {record.likeCount}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MessageCircle className="w-3 h-3" />
                                                    {record.commentCount}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default MyBrowseHistory;
