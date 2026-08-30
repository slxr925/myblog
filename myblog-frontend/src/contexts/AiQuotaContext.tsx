import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { AiQuotaVO } from '../types/api';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';
import { useAuthModal } from './AuthModalContext';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

interface AiQuotaContextValue {
  quota: AiQuotaVO | null;
  isQuotaLoading: boolean;
  refreshQuota: () => Promise<AiQuotaVO | null>;
  runAiAction: <T>(operation: (requestId: string) => Promise<T>) => Promise<T | undefined>;
}

const AiQuotaContext = createContext<AiQuotaContextValue | undefined>(undefined);

const getErrorStatus = (error: unknown): number | undefined => {
  if (!error || typeof error !== 'object') return undefined;
  const candidate = error as { status?: number; response?: { status?: number } };
  return candidate.status ?? candidate.response?.status;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return 'AI 服务暂时不可用';
};

export const AiQuotaProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [quota, setQuota] = useState<AiQuotaVO | null>(null);
  const [isQuotaLoading, setIsQuotaLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const confirmResolverRef = useRef<((accepted: boolean) => void) | null>(null);

  const refreshQuota = useCallback(async (): Promise<AiQuotaVO | null> => {
    if (!isAuthenticated) {
      setQuota(null);
      return null;
    }
    setIsQuotaLoading(true);
    try {
      const nextQuota = await api.ai.getQuota();
      setQuota(nextQuota);
      return nextQuota;
    } catch (error) {
      if (getErrorStatus(error) !== 401) {
        console.error('获取 AI 额度失败:', error);
      }
      return null;
    } finally {
      setIsQuotaLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      setQuota(null);
      return;
    }
    void refreshQuota();
  }, [isAuthenticated, isAuthLoading, user?.id, refreshQuota]);

  const requestConfirmation = useCallback(() => new Promise<boolean>((resolve) => {
    confirmResolverRef.current = resolve;
    setConfirmOpen(true);
  }), []);

  const closeConfirmation = useCallback((accepted: boolean) => {
    setConfirmOpen(false);
    confirmResolverRef.current?.(accepted);
    confirmResolverRef.current = null;
  }, []);

  const runAiAction = useCallback(async <T,>(
    operation: (requestId: string) => Promise<T>,
  ): Promise<T | undefined> => {
    if (!isAuthenticated || !user) {
      openAuthModal();
      return undefined;
    }

    const currentQuota = await refreshQuota();
    if (!currentQuota) {
      toast.error('暂时无法获取 AI 使用额度，请稍后再试。');
      return undefined;
    }
    if (!currentQuota.available) {
      toast.error('今日 AI 使用次数已用完，明日 00:00 恢复。');
      return undefined;
    }

    if (!currentQuota.unlimited) {
      const storageKey = `myblog:ai-quota-confirmed:${user.id}:${currentQuota.date}`;
      if (localStorage.getItem(storageKey) !== 'true') {
        const accepted = await requestConfirmation();
        if (!accepted) return undefined;
        localStorage.setItem(storageKey, 'true');
      }
    }

    try {
      return await operation(crypto.randomUUID());
    } catch (error) {
      const status = getErrorStatus(error);
      if (status === 429) {
        toast.error('今日 AI 使用次数已用完。');
      } else if (status === 503) {
        toast.error('AI 服务暂时不可用，本次未计入额度。');
      } else if (status === 409) {
        toast.error('该 AI 请求已处理，请勿重复提交。');
      } else {
        toast.error(getErrorMessage(error));
      }
      return undefined;
    } finally {
      await refreshQuota();
    }
  }, [isAuthenticated, openAuthModal, refreshQuota, requestConfirmation, user]);

  return (
    <AiQuotaContext.Provider value={{ quota, isQuotaLoading, refreshQuota, runAiAction }}>
      {children}
      <Dialog open={confirmOpen} onOpenChange={(open) => !open && closeConfirmation(false)}>
        <DialogContent className="max-w-sm rounded-sm border-border p-0 overflow-hidden">
          <div className="border-b border-border bg-foreground px-6 py-5 text-background">
            <div className="mb-4 flex h-10 w-10 items-center justify-center border border-background/20 bg-background/10">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <DialogHeader className="text-left">
              <DialogTitle className="font-mono-display text-base uppercase tracking-wider text-background">
                今日可使用 AI {quota?.limit ?? 3} 次
              </DialogTitle>
              <DialogDescription className="text-sm leading-6 text-background/70">
                当前剩余 {quota?.remaining ?? quota?.limit ?? 3} 次，本次操作将使用 1 次。
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="px-6 pb-6 pt-2 sm:space-x-3">
            <Button variant="outline" onClick={() => closeConfirmation(false)} className="rounded-sm">
              暂不使用
            </Button>
            <Button onClick={() => closeConfirmation(true)} className="rounded-sm bg-foreground text-background">
              确认使用
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AiQuotaContext.Provider>
  );
};

export const useAiQuota = (): AiQuotaContextValue => {
  const context = useContext(AiQuotaContext);
  if (!context) throw new Error('useAiQuota must be used within AiQuotaProvider');
  return context;
};

export const AiQuotaStatus: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { quota, isQuotaLoading } = useAiQuota();
  if (isQuotaLoading && !quota) {
    return <span className={`text-xs text-muted-foreground ${className}`}>正在读取 AI 额度...</span>;
  }
  if (!quota) return null;
  const resetLabel = new Date(quota.resetAt).toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return (
    <span className={`text-xs font-mono-display uppercase tracking-wider text-muted-foreground ${className}`}>
      {quota.unlimited
        ? 'AI 使用不限额'
        : quota.available
          ? `今日剩余 ${quota.remaining}/${quota.limit} 次`
          : `今日额度已用完 · ${resetLabel} 恢复`}
    </span>
  );
};
