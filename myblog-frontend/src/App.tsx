import React from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AuthModalProvider } from './contexts/AuthModalContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import Profile from './pages/Profile'
import BlogDetail from './pages/BlogDetail'
import EnhancedBlog from './components/EnhancedBlog'
import { Admin } from './pages/Admin'
import SearchPage from './pages/Search'
import SearchResultsPage from './pages/SearchResults'
import BlogEditor from './components/editor/BlogEditor'
import MyDrafts from './pages/MyDrafts'
import { Role } from './types/api'
import { ModernLayout } from './components/layout/ModernLayout'

const AppWrapper = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AuthModalProvider>
            <Router>
              <Routes>
                {/* 前台布局路由 */}
                <Route element={<ModernLayout />}>
                  <Route path="/" element={<EnhancedBlog />} />
                  <Route path="/blog/:id" element={<BlogDetail />} />
                  <Route path="/blog" element={<SearchPage />} />
                  <Route path="/search" element={<SearchResultsPage />} />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* 管理员专属路由 (独立布局) */}
                <Route
                  path="/blog/new"
                  element={
                    <ProtectedRoute requiredRole={Role.ADMIN}>
                      <BlogEditor mode="create" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/blog/edit/:id"
                  element={
                    <ProtectedRoute requiredRole={Role.ADMIN}>
                      <BlogEditor mode="edit" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/blog/drafts"
                  element={
                    <ProtectedRoute requiredRole={Role.ADMIN}>
                      <MyDrafts />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute requiredRole={Role.ADMIN}>
                      <Admin />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Router>
          </AuthModalProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

const App = () => {
  return <AppWrapper />
}

export default App