import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { Button } from '../ui/button';
import { UserMenu } from '../auth/UserMenu';
import ThemeToggle from '../theme/ThemeToggle';
import RealTimeSearch from '../search/RealTimeSearch';
import { Menu, X, Home, FileText, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
      {/* Navbar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isHomePage ? 'bg-background/80 backdrop-blur-md border-b border-border' : 'bg-background shadow-sm border-b border-border'
      }`}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo + Nav */}
          <div className="flex items-center gap-2">
            <div 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={() => navigate('/')}
            >
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                R
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Ryan's Blog
              </span>
            </div>

            {/* Desktop Nav - 紧跟在logo右侧 */}
            <nav className="hidden md:flex items-center gap-1 ml-6">
              <Button variant="ghost" onClick={() => navigate('/')} className="text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-muted/50">
                首页
              </Button>
              <Button variant="ghost" onClick={() => navigate('/blog')} className="text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-muted/50">
                文章
              </Button>
              <Button variant="ghost" onClick={() => navigate('/about')} className="text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-muted/50">
                关于
              </Button>
            </nav>
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            <div className="w-64">
               <RealTimeSearch placeholder="搜索文章..." />
            </div>
            
            <div className="h-6 w-px bg-border" />
            
            <ThemeToggle />
            
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <Button onClick={openAuthModal} className="rounded-full px-6 shadow-indigo-500/20">
                登录
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-muted-foreground hover:bg-muted rounded-lg"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-16 left-0 right-0 z-40 bg-background border-b border-border shadow-xl md:hidden overflow-hidden"
          >
            <div className="p-4 flex flex-col gap-2">
              <Button variant="ghost" onClick={() => handleNavigation('/')} className="justify-start w-full">
                <Home className="w-4 h-4 mr-2" /> 首页
              </Button>
              <Button variant="ghost" onClick={() => handleNavigation('/blog')} className="justify-start w-full">
                <FileText className="w-4 h-4 mr-2" /> 文章
              </Button>
              <Button variant="ghost" onClick={() => handleNavigation('/about')} className="justify-start w-full">
                <User className="w-4 h-4 mr-2" /> 关于
              </Button>
              
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
              
              <div className="px-2">
                 <RealTimeSearch placeholder="搜索文章..." />
              </div>
              
              <div className="flex items-center justify-between px-2 mt-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">切换主题</span>
                <ThemeToggle />
              </div>

              {!isAuthenticated && (
                <Button onClick={openAuthModal} className="w-full mt-4">
                  登录
                </Button>
              )}
              
              {isAuthenticated && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
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

      {/* Footer */}
      <footer className="bg-background border-t border-border py-12 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white text-xs font-bold">
                R
              </div>
              <span className="font-bold text-foreground">Ryan's Blog</span>
            </div>
            
            <div className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} Ryan Xu. All rights reserved.
            </div>
            
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};


