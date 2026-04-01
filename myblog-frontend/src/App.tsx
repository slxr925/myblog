import React, { Suspense, lazy, useEffect } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider } from './contexts/AuthContext'
import { AuthModalProvider } from './contexts/AuthModalContext'
import { FollowProvider } from './contexts/FollowContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { WebSocketProvider } from './contexts/WebSocketContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import AuthErrorHandler from './components/auth/AuthErrorHandler'
import { PageTransition } from './components/animation'
import { Role } from './types/api'
import { ModernLayout } from './components/layout/ModernLayout'

const EnhancedBlog = lazy(() => import('./components/EnhancedBlog'))
const BlogDetail = lazy(() => import('./pages/BlogDetail'))
const SearchPage = lazy(() => import('./pages/Search'))
const SearchResultsPage = lazy(() => import('./pages/SearchResults'))
const SharedCollection = lazy(() => import('./pages/SharedCollection'))
const About = lazy(() => import('./pages/About'))
const Profile = lazy(() => import('./pages/Profile'))
const Collections = lazy(() => import('./pages/user/collections'))
const Notifications = lazy(() => import('./pages/Notifications'))
const FollowingFeed = lazy(() => import('./pages/FollowingFeed'))
const BlogEditor = lazy(() => import('./components/editor/BlogEditor'))
const MyDrafts = lazy(() => import('./pages/MyDrafts'))
const Admin = lazy(() => import('./pages/Admin').then((module) => ({ default: module.Admin })))

const RouteFallback = () => (
  <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
    <div className="text-sm text-muted-foreground animate-pulse">Loading...</div>
  </div>
)

const getRouteTitle = (pathname: string) => {
  if (pathname === '/') return 'Ryan’s Blog'
  if (pathname === '/blog') return '全部文章 - MyBlog'
  if (pathname === '/about') return '关于本站 - MyBlog'
  if (pathname === '/search') return '搜索结果 - MyBlog'
  if (pathname === '/profile') return '个人中心 - MyBlog'
  if (pathname === '/user/collections') return '我的收藏 - MyBlog'
  if (pathname === '/notifications') return '消息通知 - MyBlog'
  if (pathname === '/following') return '关注动态 - MyBlog'
  if (pathname === '/blog/new') return '新建文章 - MyBlog'
  if (pathname.startsWith('/blog/edit/')) return '编辑文章 - MyBlog'
  if (pathname === '/blog/drafts') return '草稿箱 - MyBlog'
  if (pathname === '/dashboard') return '管理后台 - MyBlog'
  if (pathname.startsWith('/collection/share/')) return '共享收藏夹 - MyBlog'
  if (pathname.startsWith('/blog/')) return null
  return 'MyBlog'
}

const AppRoutes = () => {
  const location = useLocation()

  useEffect(() => {
    const nextTitle = getRouteTitle(location.pathname)
    if (nextTitle) {
      document.title = nextTitle
    }
  }, [location.pathname])

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* 前台布局路由 */}
        <Route element={<ModernLayout />}>
          <Route
            path="/"
            element={
              <PageTransition>
                <EnhancedBlog />
              </PageTransition>
            }
          />
          <Route
            path="/blog/:identifier"
            element={
              <PageTransition>
                <BlogDetail />
              </PageTransition>
            }
          />
          <Route
            path="/blog"
            element={
              <PageTransition>
                <SearchPage />
              </PageTransition>
            }
          />
          <Route
            path="/search"
            element={
              <PageTransition>
                <SearchResultsPage />
              </PageTransition>
            }
          />
          <Route
            path="/collection/share/:shareCode"
            element={
              <PageTransition>
                <SharedCollection />
              </PageTransition>
            }
          />
          <Route
            path="/about"
            element={
              <PageTransition>
                <About />
              </PageTransition>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <Profile />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/collections"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <Collections />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <Notifications />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/following"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <FollowingFeed />
                </PageTransition>
              </ProtectedRoute>
            }
          />
        </Route>

        {/* 管理员专属路由 (独立布局) */}
        <Route
          path="/blog/new"
          element={
            <ProtectedRoute requiredRole={Role.ADMIN}>
              <PageTransition>
                <BlogEditor mode="create" />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/blog/edit/:id"
          element={
            <ProtectedRoute requiredRole={Role.ADMIN}>
              <PageTransition>
                <BlogEditor mode="edit" />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/blog/drafts"
          element={
            <ProtectedRoute requiredRole={Role.ADMIN}>
              <PageTransition>
                <MyDrafts />
              </PageTransition>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole={Role.ADMIN}>
              <PageTransition>
                <Admin />
              </PageTransition>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  )
}

const AppWrapper = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <FollowProvider>
            <WebSocketProvider>
              <AuthModalProvider>
                <Router>
                  <AuthErrorHandler />
                  <Suspense fallback={<RouteFallback />}>
                    <AppRoutes />
                  </Suspense>
                </Router>
              </AuthModalProvider>
            </WebSocketProvider>
          </FollowProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

const App = () => {
  return <AppWrapper />
}

export default App
