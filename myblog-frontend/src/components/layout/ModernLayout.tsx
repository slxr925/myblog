import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { Button } from '../ui/button';
import { UserMenu } from '../auth/UserMenu';
import ThemeToggle from '../theme/ThemeToggle';
import RealTimeSearch from '../search/RealTimeSearch';
import { AIAssistant } from '../ai/AIAssistant';
import { Menu, X, Home, FileText, User, Heart, FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBadge from '../notification/NotificationBadge';

export const ModernLayout = () => {
  const { isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isHomePage = location.pathname === '/';

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground flex flex-col">
      {/* Navbar - Editorial Minimal */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isHomePage ? 'bg-background/90 backdrop-blur-sm border-b border-border/50' : 'bg-background border-b border-border'
        }`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 bg-foreground text-background flex items-center justify-center text-sm font-bold font-mono-display transition-transform group-hover:scale-105">
              R
            </div>
            <span className="hidden sm:block text-lg font-bold text-foreground tracking-tight">
              Ryan<span className="text-accent">'</span>s Blog
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-foreground hover:text-primary hover:bg-transparent font-mono-display text-sm uppercase tracking-wider h-10 px-5"
            >
              首页
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/blog')}
              className="text-foreground hover:text-primary hover:bg-transparent font-mono-display text-sm uppercase tracking-wider h-10 px-5"
            >
              文章
            </Button>
            {isAuthenticated && (
              <Button
                variant="ghost"
                onClick={() => navigate('/following')}
                className="text-foreground hover:text-primary hover:bg-transparent font-mono-display text-sm uppercase tracking-wider h-10 px-5"
              >
                动态
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => navigate('/about')}
              className="text-foreground hover:text-primary hover:bg-transparent font-mono-display text-sm uppercase tracking-wider h-10 px-5"
            >
              关于
            </Button>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            <div className="w-56">
              <RealTimeSearch placeholder="搜索..." />
            </div>

            <div className="h-4 w-px bg-border" />

            <ThemeToggle />

            {isAuthenticated && <NotificationBadge />}

            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <Button
                onClick={openAuthModal}
                variant="outline"
                className="h-8 px-4 text-xs font-mono-display uppercase tracking-wider rounded-sm hover:bg-muted"
              >
                登录
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground hover:bg-muted rounded-sm transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay - Editorial Style */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-16 left-0 right-0 z-40 bg-background border-b border-border shadow-lg md:hidden"
          >
            <div className="p-6 flex flex-col gap-4">
              {/* Navigation Links */}
              <nav className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  onClick={() => handleNavigation('/')}
                  className="justify-start w-full h-12 font-mono-display text-xs uppercase tracking-wider hover:bg-muted"
                >
                  <Home className="w-4 h-4 mr-3" /> 首页
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleNavigation('/blog')}
                  className="justify-start w-full h-12 font-mono-display text-xs uppercase tracking-wider hover:bg-muted"
                >
                  <FileText className="w-4 h-4 mr-3" /> 文章
                </Button>
                {isAuthenticated && (
                  <Button
                    variant="ghost"
                    onClick={() => handleNavigation('/following')}
                    className="justify-start w-full h-12 font-mono-display text-xs uppercase tracking-wider hover:bg-muted"
                  >
                    <Heart className="w-4 h-4 mr-3" /> 动态
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => handleNavigation('/about')}
                  className="justify-start w-full h-12 font-mono-display text-xs uppercase tracking-wider hover:bg-muted"
                >
                  <User className="w-4 h-4 mr-3" /> 关于
                </Button>
              </nav>

              <div className="h-px bg-border" />

              {/* Search */}
              <div>
                <RealTimeSearch placeholder="搜索文章..." />
              </div>

              {/* Theme Toggle */}
              <div className="flex items-center justify-between py-2">
                <span className="font-mono-display text-xs uppercase tracking-wider text-muted-foreground">
                  主题
                </span>
                <ThemeToggle />
              </div>

              {/* Notifications */}
              {isAuthenticated && (
                <div className="flex items-center justify-between py-2">
                  <span className="font-mono-display text-xs uppercase tracking-wider text-muted-foreground">
                    通知
                  </span>
                  <NotificationBadge />
                </div>
              )}

              {/* Login Button */}
              {!isAuthenticated && (
                <Button
                  onClick={openAuthModal}
                  className="w-full h-12 font-mono-display text-xs uppercase tracking-wider rounded-sm"
                >
                  登录
                </Button>
              )}

              {/* User Menu */}
              {isAuthenticated && (
                <div className="pt-4 border-t border-border">
                  <UserMenu />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 pt-16">
        <Outlet />
      </main>

      {/* Footer - Editorial Style */}
      <footer className="bg-background border-t border-border py-12 mt-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Logo & Tagline */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-foreground text-background flex items-center justify-center text-xs font-bold font-mono-display">
                  R
                </div>
                <span className="font-bold text-foreground">Ryan's Blog</span>
              </div>
              <p className="text-xs font-mono-display uppercase tracking-wider text-muted-foreground">
                Exploring Tech & Design
              </p>
            </div>

            {/* Copyright */}
            <div className="text-center md:text-left">
              <p className="text-xs font-mono-display uppercase tracking-wider text-muted-foreground">
                © {new Date().getFullYear()} Ryan Xu. All rights reserved.
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap justify-center md:justify-end gap-4 sm:gap-6 text-sm">
              <a
                href="#"
                className="text-muted-foreground hover:text-accent transition-colors font-mono-display text-xs uppercase tracking-wider"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-accent transition-colors font-mono-display text-xs uppercase tracking-wider"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-accent transition-colors font-mono-display text-xs uppercase tracking-wider"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* AI助手 */}
      <AIAssistant />
    </div>
  );
};


