import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import type { AiUsageUserVO } from '../../types/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export const AiUsagePanel: React.FC = () => {
  const [topUsers, setTopUsers] = useState<AiUsageUserVO[]>([]);

  useEffect(() => {
    api.admin.getAiUsageTopUsers(7, 10)
      .then(setTopUsers)
      .catch(() => setTopUsers([]));
  }, []);

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle>AI 使用统计</CardTitle>
      </CardHeader>
      <CardContent>
        {topUsers.length === 0 ? (
          <div className="text-sm text-muted-foreground">暂无数据</div>
        ) : (
          <div className="space-y-2">
            {topUsers.map((user) => (
              <div key={user.userId} className="flex justify-between text-sm border-b border-border pb-2">
                <div>{user.username || user.userId}</div>
                <div className="text-muted-foreground">{user.requestCount} 次 / {user.tokenCount} tokens</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
