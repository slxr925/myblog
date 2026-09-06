import { Suspense, useState, useEffect, useRef, lazy } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { Button } from '../ui/button';
import { UserMenu } from '../auth/UserMenu';
import ThemeToggle from '../theme/ThemeToggle';
import RealTimeSearch from '../search/RealTimeSearch';
import { Menu, X, Home, FileText, User, Heart } from 'lucide-react';
import NotificationBadge from '../notification/NotificationBadge';
import { getRssFeedUrl } from '../../utils/api';

const AIAssistant = lazy(() => import('../ai/AIAssistant').then(module => ({ default: module.AIAssistant })));

export const ModernLayout = () => {
  const { isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { setIsMobileMenuOpen(false); }, [location.pathname, location.search]);
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setIsMobileMenuOpen(false); menuButton.current?.focus(); }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  const links = [
    { path: '/', label: '首页', icon: Home, active: location.pathname === '/' },
    { path: '/blog', label: '文章', icon: FileText, active: location.pathname.startsWith('/blog') || location.pathname === '/search' },
    ...(isAuthenticated ? [{ path: '/following', label: '动态', icon: Heart, active: location.pathname === '/following' }] : []),
    { path: '/about', label: '关于', icon: User, active: location.pathname === '/about' },
  ];
  const navigation = (mobile = false) => links.map(({ path, label, icon: Icon, active }) => (
    <Link key={path} to={path} aria-current={active ? 'page' : undefined} className="site-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
      {mobile && <Icon aria-hidden="true" className="h-4 w-4" />}{label}
    </Link>
  ));

  return (
    <div className="min-h-screen bg-background font-sans text-foreground flex flex-col">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:bg-background focus:p-3">跳到正文</a>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="reading-shell flex h-16 items-center justify-between gap-4">
          <Link to="/" aria-label="Ryan’s Blog 首页" className="reading-link flex shrink-0 items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center bg-foreground font-mono-display text-sm font-bold text-background">R</span>
            <span className="text-base font-semibold tracking-tight">Ryan’s Blog<span className="text-accent">.</span></span>
          </Link>
          <nav aria-label="主导航" className="hidden items-center gap-2 lg:flex">{navigation()}</nav>
          <div className="hidden items-center gap-5 lg:flex">
            <div className="w-56 xl:w-72"><RealTimeSearch placeholder="搜索文章…" /></div>
            <ThemeToggle />
            {isAuthenticated && <NotificationBadge />}
            {isAuthenticated ? <UserMenu /> : <Button variant="outline" onClick={openAuthModal} className="px-6">登录</Button>}
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            <button ref={menuButton} type="button" className="reading-link flex h-11 w-11 items-center justify-center rounded-sm hover:bg-muted" onClick={() => setIsMobileMenuOpen(value => !value)} aria-label={isMobileMenuOpen ? '关闭导航菜单' : '打开导航菜单'} aria-expanded={isMobileMenuOpen} aria-controls="mobile-navigation">
              {isMobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
          </div>
        </div>
        {isMobileMenuOpen && (
          <div id="mobile-navigation" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border bg-background lg:hidden">
            <div className="reading-shell space-y-5 py-5">
              <nav aria-label="移动端导航" className="grid grid-cols-2 gap-2">{navigation(true)}</nav>
              <RealTimeSearch placeholder="搜索文章…" />
              <div className="flex items-center justify-between border-t border-border pt-4">
                {isAuthenticated ? <><UserMenu /><NotificationBadge /></> : <Button className="w-full" onClick={() => { setIsMobileMenuOpen(false); openAuthModal(); }}>登录</Button>}
              </div>
            </div>
          </div>
        )}
      </header>
      <main id="main-content" tabIndex={-1} className="flex-1 pt-16"><Outlet /></main>
      <footer className="mt-auto border-t border-border py-8">
        <div className="reading-shell flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-semibold">Ryan’s Blog</p><p className="mt-2 text-xs text-muted-foreground">记录技术，也记录思考。 © {new Date().getFullYear()} Ryan Xu</p></div>
          <nav aria-label="页脚导航" className="flex gap-6 text-sm text-muted-foreground">
            <Link className="hover:text-accent" to="/blog">文章归档</Link>
            <Link className="hover:text-accent" to="/about">关于作者</Link>
            <a className="hover:text-accent" href={getRssFeedUrl()} target="_blank" rel="noreferrer">RSS 订阅</a>
          </nav>
        </div>
      </footer>
      <Suspense fallback={null}><AIAssistant /></Suspense>
    </div>
  );
};
