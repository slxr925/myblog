import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import type { ReportVO } from '../../types/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface Props {
  onBack?: () => void;
}

export const ReportManagement: React.FC<Props> = ({ onBack }) => {
  const [reports, setReports] = useState<ReportVO[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.admin.getReports({ page: 1, size: 50 });
      setReports(response.records || []);
    } catch (error) {
      console.error('获取举报列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleReview = async (id: number, status: number) => {
    try {
      await api.admin.reviewReport(id, { status, action: status === 1 ? 'approve' : 'reject' });
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (error) {
      console.error('审核失败', error);
    }
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>举报管理</CardTitle>
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>返回</Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">加载中...</div>
        ) : reports.length === 0 ? (
          <div className="text-sm text-muted-foreground">暂无举报</div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="p-3 border border-border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{report.targetType} #{report.targetId}</div>
                    <div className="text-xs text-muted-foreground">{report.reason || '未填写原因'}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleReview(report.id, 1)} disabled={report.status === 1}>
                      通过
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleReview(report.id, 2)} disabled={report.status === 2}>
                      拒绝
                    </Button>
                  </div>
                </div>
                {report.detail && <div className="text-sm mt-2 text-muted-foreground">{report.detail}</div>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
