import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import ThemeToggle from '../theme/ThemeToggle';
import { UserMenu } from '../auth/UserMenu';
import { useAuth } from '../../contexts/AuthContext';
import RealTimeSearch from '../search/RealTimeSearch';
import {
  Home,
  User,
  Mail,
  LogIn,
  Menu,
  ArrowRight
} from 'lucide-react';

interface NavigationProps {
  title?: string;
  showHero?: boolean;
  heroTitle?: string;
  heroSubtitle?: string;
  heroButtons?: React.ReactNode;
  isAuthModalOpen?: boolean;
  setIsAuthModalOpen?: (open: boolean) => void;
}

const Navigation: React.FC<NavigationProps> = ({
  title = "Ryan's Blog",
  showHero = true,
  heroTitle = "Welcome.",
  heroSubtitle = "探索最新的技术分享、项目实战和学习心得",
  heroButtons,
  isAuthModalOpen: externalIsAuthModalOpen,
  setIsAuthModalOpen: externalSetIsAuthModalOpen
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 使用外部传入的模态框状态，如果没有则使用内部状态（向后兼容）
  const [internalIsAuthModalOpen, setInternalIsAuthModalOpen] = useState(false);
  const isAuthModalOpen = externalIsAuthModalOpen !== undefined ? externalIsAuthModalOpen : internalIsAuthModalOpen;
  const setIsAuthModalOpen = externalSetIsAuthModalOpen !== undefined ? externalSetIsAuthModalOpen : setInternalIsAuthModalOpen;

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Navigation */}
      <nav className="relative z-50 p-6">
        <div className="bg-background/90 backdrop-blur-xl border border-border rounded-xl max-w-7xl mx-auto shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold text-foreground transition-colors duration-300">{title}</h1>

              {/* 实时搜索栏 */}
              <RealTimeSearch
                className="relative flex items-center"
                placeholder="搜索文章..."
              />
            </div>

            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                className="text-foreground hover:bg-accent transition-colors duration-300"
                onClick={() => handleNavigation('/')}
              >
                <Home className="w-4 h-4 mr-2" />
                首页
              </Button>
              <Button
                variant="ghost"
                className="text-foreground hover:bg-accent transition-colors duration-300"
                onClick={() => handleNavigation('/profile')}
              >
                <User className="w-4 h-4 mr-2" />
                {isAuthenticated ? '个人资料' : '关于'}
              </Button>
              <Button
                variant="ghost"
                className="text-foreground hover:bg-accent transition-colors duration-300"
              >
                <Mail className="w-4 h-4 mr-2" />
                联系
              </Button>

              <ThemeToggle />
              {isAuthenticated ? (
                <UserMenu />
              ) : (
                <Button
                  variant="outline"
                  className="border-border text-foreground hover:bg-accent transition-colors duration-300"
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  登录
                </Button>
              )}
            </div>

            <Button
              variant="ghost"
              className="md:hidden text-foreground"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-xl">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMenuOpen(false)} />
          <div className="relative bg-background border-b border-border p-4">
            <div className="flex flex-col space-y-4">
              <Button
                variant="ghost"
                className="text-foreground hover:bg-accent justify-start transition-colors duration-300"
                onClick={() => handleNavigation('/')}
              >
                <Home className="w-4 h-4 mr-2" />
                首页
              </Button>
              <Button
                variant="ghost"
                className="text-foreground hover:bg-accent justify-start transition-colors duration-300"
                onClick={() => handleNavigation('/profile')}
              >
                <User className="w-4 h-4 mr-2" />
                {isAuthenticated ? '个人资料' : '关于'}
              </Button>
              <Button
                variant="ghost"
                className="text-foreground hover:bg-accent justify-start transition-colors duration-300"
              >
                <Mail className="w-4 h-4 mr-2" />
                联系
              </Button>
              <div className="pt-4 border-t border-border">
                <ThemeToggle />
              </div>
              {!isAuthenticated && (
                <Button
                  variant="outline"
                  className="w-full border-border text-foreground hover:bg-accent transition-colors duration-300 mt-4"
                  onClick={() => {
                    setIsAuthModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  登录
                </Button>
              )}
              {isAuthenticated && (
                <div className="pt-4 border-t border-border">
                  <UserMenu />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      {showHero && (
        <section className="relative z-40 px-6 pt-16 pb-8 bg-muted/50 transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-4xl mx-auto">
              <h2 className="text-5xl font-bold text-foreground mb-6 leading-tight transition-colors duration-300">
                {heroTitle}
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed transition-colors duration-300">
                {heroSubtitle}
              </p>
              {heroButtons !== null && (heroButtons || (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg transition-colors duration-300"
                    onClick={() => handleNavigation('/blog')}
                  >
                    开始阅读
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    className="border-border text-foreground hover:bg-accent px-8 py-3 text-lg transition-colors duration-300"
                    onClick={() => handleNavigation('/blog')}
                  >
                    浏览文章
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default Navigation;