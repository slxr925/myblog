import React, { useState, useEffect } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, Eye, Heart, MessageCircle, User, Search, Tag, ArrowRight, Github, Twitter, Mail, LogIn } from 'lucide-react'
import { Card, CardContent, CardHeader } from './components/ui/card'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Badge } from './components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar'
import { api } from './utils/api'
import type { BlogPost } from './types/api'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AuthModal } from './components/auth/AuthModal'
import { UserMenu } from './components/auth/UserMenu'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Dashboard } from './pages/Dashboard'
import { Admin } from './pages/Admin'
import Profile from './pages/Profile'
import { Role } from './types/api'

interface PersonalBlogProps {
  authorName?: string
  authorBio?: string
  authorAvatar?: string
}

const PersonalBlog: React.FC<PersonalBlogProps> = ({
  authorName = "张三",
  authorBio = "全栈开发工程师，专注于现代Web技术栈。热爱分享技术心得和编程经验。",
  authorAvatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
}) => {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([])
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // 获取所有标签
  const allTags = Array.from(new Set(posts.flatMap(post => post.tags)))

  // 获取博客数据
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true)
        // 获取最新博客
        const latestPosts = await api.blog.getLatestBlogs(10)
        // 获取热门博客
        const hotPosts = await api.blog.getHotBlogs(5)

        // 合并数据，并标记热门博客为精选
        const allPosts = [
          ...hotPosts.map(post => ({ ...post, featured: true })),
          ...latestPosts.filter(post => !hotPosts.some(hot => hot.id === post.id))
        ]

        setPosts(allPosts)
        setFilteredPosts(allPosts)
      } catch (error) {
        console.error('获取博客数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  // 过滤博客
  useEffect(() => {
    let filtered = posts

    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (selectedTag) {
      filtered = filtered.filter(post => post.tags.includes(selectedTag))
    }

    setFilteredPosts(filtered)
  }, [searchTerm, selectedTag, posts])

  const handleLike = async (postId: number) => {
    try {
      await api.blog.toggleLike(postId)
      setLikedPosts(prev => {
        const newSet = new Set(prev)
        if (newSet.has(postId)) {
          newSet.delete(postId)
        } else {
          newSet.add(postId)
        }
        return newSet
      })

      // 更新本地文章数据
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {
              ...post,
              likes: likedPosts.has(postId) ? post.likes - 1 : post.likes + 1
            }
            : post
        )
      )
    } catch (error) {
      console.error('点赞失败:', error)
    }
  }

  const featuredPost = posts.find(post => post.featured)
  const regularPosts = filteredPosts.filter(post => !post.featured)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.h1
              className="text-2xl font-bold text-foreground"
              whileHover={{ scale: 1.05 }}
            >
              {authorName}的博客
            </motion.h1>
            <nav className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>首页</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/about')}>关于</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/contact')}>联系</Button>
              {isAuthenticated && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                    控制台
                  </Button>
                  {user?.role === Role.ADMIN && (
                    <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
                      管理员
                    </Button>
                  )}
                </>
              )}
              <div className="flex items-center space-x-2">
                {isAuthenticated ? (
                  <UserMenu />
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="flex items-center space-x-1"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>登录</span>
                  </Button>
                )}
              </div>
            </nav>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Featured Post */}
            {featuredPost && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
              >
                <Card className="overflow-hidden border-border bg-card hover:shadow-lg transition-shadow duration-300">
                  <div className="relative">
                    <img
                      src={featuredPost.image}
                      alt={featuredPost.title}
                      className="w-full h-64 object-cover"
                    />
                    <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                      精选文章
                    </Badge>
                  </div>
                  <CardContent className="p-6">
                    <h2 
                      className="text-2xl font-bold text-foreground mb-3 hover:text-primary transition-colors cursor-pointer"
                      onClick={() => navigate(`/blog/${featuredPost.id}`)}
                    >
                      {featuredPost.title}
                    </h2>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {featuredPost.date}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {featuredPost.readTime}
                        </span>
                      </div>
                      <Button className="group" onClick={() => navigate(`/blog/${featuredPost.id}`)}>
                        阅读更多
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Search and Filter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="搜索文章..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedTag === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTag(null)}
                >
                  全部
                </Button>
                {allTags.map(tag => (
                  <Button
                    key={tag}
                    variant={selectedTag === tag ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTag(tag)}
                    className="flex items-center"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Button>
                ))}
              </div>
            </motion.div>

            {/* Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                // 加载状态
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-96 bg-muted animate-pulse rounded-xl" />
                ))
              ) : (
                <AnimatePresence>
                  {regularPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -5 }}
                    >
                      <Card className="h-full overflow-hidden border-border bg-card hover:shadow-lg transition-all duration-300 group cursor-pointer" onClick={() => navigate(`/blog/${post.id}`)}>
                        <div className="relative overflow-hidden">
                          <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <CardContent className="p-6">
                          <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                            {post.excerpt}
                          </p>

                          <div className="flex flex-wrap gap-1 mb-4">
                            {post.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {post.date}
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {post.readTime}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span className="flex items-center">
                                <Eye className="w-4 h-4 mr-1" />
                                {post.views}
                              </span>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleLike(post.id)}
                                className={`flex items-center transition-colors ${likedPosts.has(post.id) ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
                                  }`}
                              >
                                <Heart className={`w-4 h-4 mr-1 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                                {post.likes + (likedPosts.has(post.id) ? 1 : 0)}
                              </motion.button>
                              <span className="flex items-center">
                                <MessageCircle className="w-4 h-4 mr-1" />
                                {post.comments}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {!loading && filteredPosts.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <p className="text-muted-foreground text-lg">没有找到匹配的文章</p>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Author Card */}
            <Card className="border-border bg-card">
              <CardHeader className="text-center">
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarImage src={authorAvatar} alt={authorName} />
                  <AvatarFallback>
                    <User className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-semibold text-foreground">{authorName}</h3>
                <p className="text-muted-foreground text-sm">{authorBio}</p>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center space-x-4">
                  <Button size="sm" variant="outline" className="p-2">
                    <Github className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="p-2">
                    <Twitter className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="p-2">
                    <Mail className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Popular Tags */}
            <Card className="border-border bg-card">
              <CardHeader>
                <h3 className="text-lg font-semibold text-foreground">热门标签</h3>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => setSelectedTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Posts */}
            <Card className="border-border bg-card">
              <CardHeader>
                <h3 className="text-lg font-semibold text-foreground">最新文章</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {posts.slice(0, 3).map(post => (
                  <div 
                    key={post.id} 
                    className="flex space-x-3 group cursor-pointer"
                    onClick={() => navigate(`/blog/${post.id}`)}
                  >
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">{post.date}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* 认证模态框 */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  )
}

const AppWrapper = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            {/* 公开路由 */}
            <Route path="/" element={<PersonalBlog />} />
            <Route path="/about" element={<div className="container mx-auto px-4 py-8"><h1 className="text-2xl font-bold">关于我</h1></div>} />
            <Route path="/contact" element={<div className="container mx-auto px-4 py-8"><h1 className="text-2xl font-bold">联系我</h1></div>} />

            {/* 需要认证的路由 */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* 需要管理员权限的路由 */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole={Role.ADMIN}>
                  <Admin />
                </ProtectedRoute>
              }
            />

            {/* 个人资料页面 */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

const App = () => {
  return <AppWrapper />
}

export default App