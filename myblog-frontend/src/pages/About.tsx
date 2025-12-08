import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Github, Mail, Code2, Database, Globe, Server, Rocket, Heart, User } from 'lucide-react';

const About: React.FC = () => {
  const techStacks = [
    {
      category: '前端技术',
      icon: <Code2 className="w-5 h-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'Framer Motion']
    },
    {
      category: '后端技术',
      icon: <Server className="w-5 h-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      technologies: ['Spring Boot', 'MyBatis Plus', 'MySQL', 'Redis', 'JWT']
    },
    {
      category: '搜索引擎',
      icon: <Database className="w-5 h-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      technologies: ['Elasticsearch', 'Spring Data ES']
    },
    {
      category: '部署运维',
      icon: <Rocket className="w-5 h-5" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      technologies: ['Docker', 'Nginx', 'Linux', 'Shell Script']
    }
  ];

  const features = [
    { title: '响应式设计', description: '完美适配各种设备尺寸' },
    { title: '深色模式', description: '支持明暗主题切换' },
    { title: '全文搜索', description: 'Elasticsearch 强力支持' },
    { title: '实时预览', description: 'Markdown 编辑器实时渲染' },
    { title: '代码高亮', description: '优雅的代码展示效果' },
    { title: '评论互动', description: '支持文章评论和点赞' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-muted/30 min-h-screen py-12"
    >
      <div className="container mx-auto px-4 max-w-6xl">
        {/* 头部介绍 */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-foreground mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600"
          >
            关于本站
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            一个专注于技术分享的现代化博客平台
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* 左侧：关于博客 */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Globe className="w-5 h-5 text-indigo-600" />
                  博客简介
                </CardTitle>
                <CardDescription>一个现代化的全栈博客系统</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  这是一个基于 Spring Boot + React 构建的现代化博客平台，采用前后端分离架构，
                  提供优雅的阅读体验和强大的内容管理功能。
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  博客支持 Markdown 写作、代码高亮、全文搜索、深色模式等特性，
                  旨在为技术爱好者提供一个简洁、高效的内容创作和分享平台。
                </p>
                <div className="pt-4 border-t border-border">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-indigo-600" />
                    核心特性
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {features.map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start gap-2"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2" />
                        <div>
                          <p className="font-medium text-foreground text-sm">{feature.title}</p>
                          <p className="text-xs text-muted-foreground">{feature.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 技术栈 */}
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Code2 className="w-5 h-5 text-indigo-600" />
                  技术栈
                </CardTitle>
                <CardDescription>使用的主要技术和框架</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {techStacks.map((stack, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-xl border border-border bg-muted/30 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`${stack.bgColor} p-2 rounded-lg ${stack.color}`}>
                          {stack.icon}
                        </div>
                        <h4 className="font-semibold text-foreground">{stack.category}</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {stack.technologies.map((tech, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：联系方式 */}
          <div className="space-y-6">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  关于作者
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3">
                    R
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Ryan Xu</h3>
                  <p className="text-sm text-muted-foreground mt-1">全栈开发者</p>
                </div>

                <div className="pt-4 border-t border-border space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    热爱技术，专注于 Web 全栈开发，
                    喜欢探索新技术并记录学习过程。
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  联系方式
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <a 
                  href="https://github.com/slxr925" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                    <Github className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">GitHub</p>
                    <p className="text-xs text-muted-foreground">@slxr925</p>
                  </div>
                </a>

                <a 
                  href="mailto:contact@example.com"
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                    <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Email</p>
                    <p className="text-xs text-muted-foreground">contact@example.com</p>
                  </div>
                </a>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    感谢您的访问
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Built with ❤️ by Ryan
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 底部统计 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: '文章总数', value: '47', color: 'from-blue-500 to-cyan-500' },
            { label: '技术分类', value: '12', color: 'from-purple-500 to-pink-500' },
            { label: '代码示例', value: '138', color: 'from-orange-500 to-red-500' },
            { label: '访问量', value: '2.3K', color: 'from-green-500 to-emerald-500' },
          ].map((stat, index) => (
            <Card key={index} className="border-border shadow-sm overflow-hidden">
              <CardContent className="p-6 text-center">
                <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default About;
