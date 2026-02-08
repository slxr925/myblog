import React from 'react'
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
import Profile from './pages/Profile'
import About from './pages/About'
import BlogDetail from './pages/BlogDetail'
import EnhancedBlog from './components/EnhancedBlog'
import { Admin } from './pages/Admin'
import SearchPage from './pages/Search'
import SearchResultsPage from './pages/SearchResults'
import SharedCollection from './pages/SharedCollection'
import BlogEditor from './components/editor/BlogEditor'
import MyDrafts from './pages/MyDrafts'
import Collections from './pages/user/collections'
import Notifications from './pages/Notifications'
import FollowingFeed from './pages/FollowingFeed'
import { Role } from './types/api'
import { ModernLayout } from './components/layout/ModernLayout'

const AppRoutes = () => {
  const location = useLocation()

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
            path="/blog/:id"
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
                  <AppRoutes />
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
