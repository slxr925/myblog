import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { TrendingUp, Users, FileText, MessageSquare } from 'lucide-react';
import type { DailyStatsDTO } from '../../types/api';

interface ActivityChartProps {
  data: DailyStatsDTO[];
  title?: string;
  showLegend?: boolean;
}

export const ActivityChart: React.FC<ActivityChartProps> = ({
  data,
  title = "活跃度趋势",
  showLegend = true
}) => {
  // 格式化数据用于图表显示
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    }),
    fullDate: item.date,
    新增用户: item.newUsers,
    新增文章: item.newBlogs,
    新增评论: item.newComments,
  }));

  // 自定义Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-semibold mb-2">{data.fullDate}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // 计算统计信息
  const totalNewUsers = data.reduce((sum, item) => sum + item.newUsers, 0);
  const totalNewBlogs = data.reduce((sum, item) => sum + item.newBlogs, 0);
  const totalNewComments = data.reduce((sum, item) => sum + item.newComments, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>{title}</span>
          </CardTitle>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4 text-blue-500" />
              <span>用户: {totalNewUsers}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FileText className="w-4 h-4 text-green-500" />
              <span>文章: {totalNewBlogs}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageSquare className="w-4 h-4 text-orange-500" />
              <span>评论: {totalNewComments}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend
                wrapperStyle={{ fontSize: '14px' }}
                iconType="line"
              />
            )}
            <Line
              type="monotone"
              dataKey="新增用户"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="新增文章"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="新增评论"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};