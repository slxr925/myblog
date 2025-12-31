import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Github, Mail, Code2, Database, Globe, Server, Rocket, Heart, User, ExternalLink } from 'lucide-react';

const About: React.FC = () => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const techStacks = [
    {
      category: '前端技术',
      icon: <Code2 className="w-5 h-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      technologies: ['React 19', 'TypeScript 5.8', 'Vite 7', 'Tailwind CSS 4', 'Framer Motion']
    },
    {
      category: '后端技术',
      icon: <Server className="w-5 h-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
      technologies: ['Spring Boot 3.5', 'MyBatis Plus', 'Spring Security', 'Spring Data JPA', 'Kafka', 'WebSocket']
    },
    {
      category: '数据架构',
      icon: <Database className="w-5 h-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
      technologies: ['MySQL 8.0', 'Redis 7.x', 'Elasticsearch 8.11']
    },
    {
      category: 'DevOps & AI',
      icon: <Rocket className="w-5 h-5" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
      technologies: ['Spring AI (ZhipuGLM)', 'Docker', 'Nginx', 'GitHub Actions']
    }
  ];

  const features = [
    { title: '响应式设计', description: '完美适配移动端和桌面端，提供流畅体验' },
    { title: '深色模式', description: '基于系统偏好的明暗主题自动切换' },
    { title: 'AI 智能助手', description: 'Spring AI 驱动的智能问答与文章分析' },
    { title: '实时通知', description: '基于 WebSocket 的实时消息推送系统' },
    { title: '全文搜索', description: 'Elasticsearch 毫秒级全文检索能力' },
    { title: '互动社区', description: '完整的评论、回复、点赞与关注体系' },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="min-h-screen bg-muted/30 py-12 transition-colors duration-300"
    >
      <div className="container mx-auto px-4 max-w-6xl">
        {/* 头部介绍 */}
        <div className="text-center mb-16">
          <motion.div variants={item} className="inline-block p-3 bg-card rounded-2xl shadow-sm mb-6 border border-border">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
              <Globe className="w-8 h-8" />
            </div>
          </motion.div>
          <motion.h1
            variants={item}
            className="text-4xl md:text-5xl font-bold text-foreground mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400"
          >
            关于本站
          </motion.h1>
          <motion.p
            variants={item}
            className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            一个专注于技术分享的现代化博客平台，
            <br className="hidden md:block" />
            融合了最新的 Web 开发技术与 AI 智能特性。
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* 左侧主要内容：8列 */}
          <div className="lg:col-span-8 space-y-8">
            {/* 博客简介 */}
            <motion.div variants={item}>
              <Card className="border-border shadow-sm overflow-hidden bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl text-foreground">
                    <span className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                      <Rocket className="w-5 h-5" />
                    </span>
                    项目概述
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground">
                    <p className="leading-relaxed">
                      这是一个基于 <strong>Spring Boot 3.5</strong> 和 <strong>React 19</strong> 构建的全栈博客系统。
                      项目不仅是一个内容发布平台，更是对微服务架构、实时通信、搜索引擎以及 AI 应用集成的实践探索。
                    </p>
                    <p className="leading-relaxed">
                      我们致力于打造极致的用户体验：从秒级加载的页面性能，到平滑自然的交互动画；
                      从精准的全文检索，到懂你所想的 AI 助手。每一个细节都经过精心打磨。
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-foreground text-sm mb-1">{feature.title}</h4>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 技术栈 */}
            <motion.div variants={item}>
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Code2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                技术架构
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {techStacks.map((stack, index) => (
                  <Card key={index} className="border-border shadow-sm hover:shadow-md transition-shadow group bg-card">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`${stack.bgColor} p-2.5 rounded-xl ${stack.color} group-hover:scale-105 transition-transform`}>
                          {stack.icon}
                        </div>
                        <h4 className="font-semibold text-foreground">{stack.category}</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {stack.technologies.map((tech, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted/80">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </div>

          {/* 右侧边栏：4列 */}
          <div className="lg:col-span-4 space-y-6">
            {/* 作者信息 */}
            <motion.div variants={item}>
              <Card className="border-border shadow-sm overflow-hidden text-center bg-card">
                <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                <div className="-mt-12 mb-4 flex justify-center">
                  <div className="w-24 h-24 bg-card rounded-full p-2 shadow-md">
                    <div className="w-full h-full bg-muted rounded-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                      R
                    </div>
                  </div>
                </div>
                <CardContent className="pb-8">
                  <h3 className="text-xl font-bold text-foreground">Ryan Xu</h3>
                  <p className="text-indigo-600 dark:text-indigo-400 font-medium text-sm mb-4">Full Stack Developer</p>
                  <p className="text-muted-foreground text-sm mb-6 px-4">
                    热爱开源，热衷于探索前沿技术。
                    构建优雅的代码，创造有价值的产品。
                  </p>

                  <div className="flex justify-center gap-3">
                    <a href="https://github.com/slxr925" target="_blank" title="GitHub" rel="noopener noreferrer" className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all">
                      <Github className="w-5 h-5" />
                    </a>
                    <a href="mailto:contact@example.com" title="Email" className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all">
                      <Mail className="w-5 h-5" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 统计数据 */}
            <motion.div variants={item}>
              <Card className="border-border shadow-sm bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Database className="w-4 h-4 opacity-80" />
                    数据概览
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                      <div className="text-2xl font-bold">47</div>
                      <div className="text-xs opacity-70">文章总数</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                      <div className="text-2xl font-bold">2.3k</div>
                      <div className="text-xs opacity-70">总访问量</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                      <div className="text-2xl font-bold">128</div>
                      <div className="text-xs opacity-70">获赞总数</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                      <div className="text-2xl font-bold">99%</div>
                      <div className="text-xs opacity-70">好评率</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 致谢 */}
            <motion.div variants={item}>
              <Card className="border-border shadow-sm bg-card">
                <CardContent className="p-6 text-center">
                  <Heart className="w-8 h-8 text-rose-500 mx-auto mb-3 animate-pulse" />
                  <p className="text-muted-foreground text-sm">
                    感谢每一位访问者
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Made with ❤️ by Ryan
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default About;
