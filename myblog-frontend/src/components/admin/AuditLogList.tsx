import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface AuditLogItem {
  id: number;
  operatorId?: number;
  action?: string;
  targetType?: string;
  targetId?: number;
  ip?: string;
  createTime?: string;
}

export const AuditLogList: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);

  useEffect(() => {
    api.admin.getAuditLogs({ page: 1, size: 50 })
      .then((res: any) => setLogs(res.records || []))
      .catch(() => setLogs([]));
  }, []);

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle>审计日志</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-sm text-muted-foreground">暂无日志</div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="text-sm text-muted-foreground border-b border-border pb-2">
                <div className="text-foreground">
                  {log.action} {log.targetType} {log.targetId ? `#${log.targetId}` : ''}
                </div>
                <div className="text-xs">操作人: {log.operatorId || '-'} · {log.ip || '-'} · {log.createTime || ''}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
