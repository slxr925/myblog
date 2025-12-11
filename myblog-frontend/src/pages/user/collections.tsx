import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import FolderSidebar from '../../components/collection/FolderSidebar';
import CollectionList from '../../components/collection/CollectionList';

const CollectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeFolderId, setActiveFolderId] = useState<number | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!user) {
    navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
    return null;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">我的收藏</h1>
          <p className="mt-1 text-sm text-gray-600">
            管理您收藏的博客文章
          </p>
        </div>

        {/* 主要内容区域 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100vh-200px)]">
          <div className="flex h-full">
            {/* 侧边栏 */}
            <FolderSidebar
              activeFolderId={activeFolderId}
              onFolderSelect={setActiveFolderId}
              onRefresh={handleRefresh}
            />

            {/* 收藏列表 */}
            <CollectionList
              key={refreshKey}
              folderId={activeFolderId}
              onRefresh={handleRefresh}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionsPage;