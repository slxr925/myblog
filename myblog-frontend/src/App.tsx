import React from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import Profile from './pages/Profile'
import BlogDetail from './pages/BlogDetail'
import EnhancedBlog from './components/EnhancedBlog'
import { Admin } from './pages/Admin'
import SearchPage from './pages/Search'
import SearchResultsPage from './pages/SearchResults'

const AppWrapper = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
          <Routes>
            {/* 公开路由 */}
            <Route path="/" element={<EnhancedBlog />} />
            <Route path="/blog/:id" element={<BlogDetail />} />
            <Route path="/blog" element={<SearchPage />} />
            <Route path="/search" element={<SearchResultsPage />} />

            {/* 需要认证的路由 */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  </ErrorBoundary>
  )
}

const App = () => {
  return <AppWrapper />
}

export default App