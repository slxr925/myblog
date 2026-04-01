import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { api } from '../utils/api';
import { getPublicBlogPath } from '../utils/blogLinks';
import type { CollectionFolderVO, UserCollectionVO } from '../types/api';
import { Calendar, BookOpen } from 'lucide-react';

const SharedCollection: React.FC = () => {
  const { shareCode } = useParams();
  const navigate = useNavigate();
  const [folder, setFolder] = useState<CollectionFolderVO | null>(null);
  const [items, setItems] = useState<UserCollectionVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (shareCode) {
      fetchShared(1, true);
    }
  }, [shareCode]);

  const fetchShared = async (pageNum: number, reset = false) => {
    if (!shareCode) {
      setError('分享链接无效');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.collection.getSharedFolder(shareCode, pageNum, 10);
      if (reset) {
        setFolder(response.folder);
        setItems(response.items || []);
      } else {
        setItems(prev => [...prev, ...(response.items || [])]);
      }
      setHasMore((response.items || []).length >= 10);
      setPage(pageNum + 1);
    } catch (err) {
      console.error('获取分享收藏夹失败:', err);
      setError('分享链接已失效或不存在');
    } finally {
      setLoading(false);
    }
  };

  if (loading && items.length === 0 && !error) {
    return (
      <div className="min-h-screen bg-muted/30 py-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="h-40 bg-card rounded-3xl border border-border animate-pulse mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-card rounded-2xl border border-border animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted/30 py-10">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <Card className="border-border">
            <CardContent className="p-10">
              <div className="text-2xl font-semibold text-foreground mb-2">无法访问分享内容</div>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => navigate('/')}>返回首页</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-10">
      <div className="container mx-auto px-4 max-w-5xl space-y-8">
        <Card className="border-border shadow-sm">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground">{folder?.name || '收藏夹'}</h1>
                </div>
                {folder?.description && (
                  <p className="text-muted-foreground">{folder.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">公开收藏</Badge>
                {folder?.shareExpireTime && (
                  <Badge variant="outline">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(folder.shareExpireTime).toLocaleDateString('zh-CN')}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {items.length === 0 ? (
          <Card className="border-border">
            <CardContent className="p-10 text-center text-muted-foreground">
              暂无收藏内容
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <Card key={item.id} className="border-border hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <h3
                        className="text-lg font-semibold text-foreground hover:text-primary cursor-pointer truncate"
                        onClick={() => navigate(getPublicBlogPath({ publicId: item.publicId ?? item.blog?.publicId, id: item.blogId }))}
                      >
                        {item.blogTitle}
                      </h3>
                      <Badge variant="outline">{item.authorName}</Badge>
                    </div>
                    {item.blogSummary && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.blogSummary}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{item.viewCount} 阅读</span>
                      <span>{item.createTime ? new Date(item.createTime).toLocaleDateString('zh-CN') : '-'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {hasMore && items.length > 0 && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => fetchShared(page)} disabled={loading}>
              {loading ? '加载中...' : '加载更多'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedCollection;
