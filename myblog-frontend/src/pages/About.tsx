import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Github, Mail, Code2, Database, Server, Rocket, Heart } from 'lucide-react';
import { api } from '../utils/api';

interface AboutStats {
  totalBlogs: number;
  totalViews: number;
  totalLikes: number;
}

const About: React.FC = () => {
  const [stats, setStats] = useState<AboutStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

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
      technologies: ['React 19', 'TypeScript 5.8', 'Vite 7', 'Tailwind CSS 4', 'Framer Motion']
    },
    {
      category: '后端技术',
      icon: <Server className="w-5 h-5" />,
      technologies: ['Spring Boot 3.5', 'MyBatis Plus', 'Spring Security', 'Spring Data JPA', 'Kafka', 'WebSocket']
    },
    {
      category: '数据架构',
      icon: <Database className="w-5 h-5" />,
      technologies: ['MySQL 8.0', 'Redis 7.x', 'Elasticsearch 8.11']
    },
    {
      category: 'DevOps & AI',
      icon: <Rocket className="w-5 h-5" />,
      technologies: ['Spring AI', 'Docker', 'Nginx', 'GitHub Actions']
    }
  ];

  const features = [
    { title: '响应式设计', description: '完美适配移动端和桌面端' },
    { title: '深色模式', description: '明暗主题自动切换' },
    { title: 'AI 智能助手', description: 'Spring AI 驱动的智能问答' },
    { title: '实时通知', description: 'WebSocket 实时消息推送' },
    { title: '全文搜索', description: 'Elasticsearch 毫秒级检索' },
    { title: '互动社区', description: '完整的评论、点赞与关注' },
  ];

  useEffect(() => {
    let cancelled = false;

    const fetchStats = async () => {
      setStatsLoading(true);
      setStatsError(null);

      const pageSize = 100;

      try {
        const firstPage = await api.blog.getPage({ page: 1, size: pageSize, status: 1 });

        if (cancelled) {
          return;
        }

        const initialRecords = Array.isArray(firstPage.records) ? firstPage.records : [];
        const totalBlogs = typeof firstPage.total === 'number' ? firstPage.total : initialRecords.length;
        const totalPages = Math.max(
          typeof firstPage.pages === 'number' ? firstPage.pages : Math.ceil(totalBlogs / pageSize),
          1,
        );

        let totalViews = initialRecords.reduce((sum, blog) => sum + (blog.viewCount || 0), 0);
        let totalLikes = initialRecords.reduce((sum, blog) => sum + (blog.likeCount || 0), 0);

        if (totalPages > 1) {
          const remainingPages = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, index) =>
              api.blog.getPage({ page: index + 2, size: pageSize, status: 1 }),
            ),
          );

          if (cancelled) {
            return;
          }

          remainingPages.forEach((pageResult) => {
            const records = Array.isArray(pageResult.records) ? pageResult.records : [];
            totalViews += records.reduce((sum, blog) => sum + (blog.viewCount || 0), 0);
            totalLikes += records.reduce((sum, blog) => sum + (blog.likeCount || 0), 0);
          });
        }

        setStats({
          totalBlogs,
          totalViews,
          totalLikes,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        console.error('获取关于页统计失败:', error);
        setStatsError('真实统计加载失败');
      } finally {
        if (!cancelled) {
          setStatsLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      cancelled = true;
    };
  }, []);

  const formatStatValue = (value: number) => new Intl.NumberFormat('zh-CN').format(value);

  const statCards = [
    {
      label: '文章总数',
      value: stats?.totalBlogs ?? 0,
      className: '',
    },
    {
      label: '总访问量',
      value: stats?.totalViews ?? 0,
      className: '',
    },
    {
      label: '获赞总数',
      value: stats?.totalLikes ?? 0,
      className: 'sm:col-span-2',
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="min-h-screen bg-background py-12"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div variants={item} className="mb-6">
            <div className="w-24 h-24 bg-foreground text-background flex items-center justify-center text-2xl font-bold font-mono-display mx-auto">
              R
            </div>
          </motion.div>
          <motion.h1
            variants={item}
            className="text-editorial-lg text-foreground mb-6"
          >
            关于本站
          </motion.h1>
          <motion.p
            variants={item}
            className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light"
          >
            一个专注于技术分享的现代化博客平台，
            <br className="hidden md:block" />
            融合了最新的 Web 开发技术与 AI 智能特性。
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Project Overview */}
            <motion.div variants={item}>
              <div className="border border-border p-8 bg-card">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-accent/10 flex items-center justify-center text-accent">
                    <Rocket className="w-4 h-4" />
                  </span>
                  项目概述
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    这是一个基于 <strong>Spring Boot 3.5</strong> 和 <strong>React 19</strong> 构建的全栈博客系统。
                    项目不仅是一个内容发布平台，更是对微服务架构、实时通信、搜索引擎以及 AI 应用集成的实践探索。
                  </p>
                  <p>
                    我们致力于打造极致的用户体验：从秒级加载的页面性能，到平滑自然的交互动画；
                    从精准的全文检索，到懂你所想的 AI 助手。每一个细节都经过精心打磨。
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border border-border hover:border-accent/50 transition-colors">
                      <span className="w-1.5 h-1.5 bg-accent rotate-45 mt-2 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-foreground text-sm mb-1">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground font-light">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Tech Stack */}
            <motion.div variants={item}>
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Code2 className="w-6 h-6 text-accent" />
                技术架构
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {techStacks.map((stack, index) => (
                  <div key={index} className="border border-border p-5 hover:border-accent/50 transition-colors bg-card">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-accent/10 text-accent">
                        {stack.icon}
                      </div>
                      <h4 className="font-semibold text-foreground">{stack.category}</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {stack.technologies.map((tech, idx) => (
                        <span key={idx} className="px-2 py-1 bg-muted text-xs font-mono-display uppercase tracking-wider text-muted-foreground">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Author Info */}
            <motion.div variants={item}>
              <div className="border border-border bg-card overflow-hidden">
                <div className="h-20 bg-foreground"></div>
                <div className="-mt-10 mb-4 flex justify-center">
                  <div className="w-20 h-20 bg-card rounded-full p-2 border border-border">
                    <div className="w-full h-full bg-muted rounded-full flex items-center justify-center text-xl font-bold text-foreground font-mono-display">
                      R
                    </div>
                  </div>
                </div>
                <div className="px-6 pb-6 text-center">
                  <h3 className="text-lg font-bold text-foreground mb-1">Ryan Xu</h3>
                  <p className="text-accent font-mono-display text-xs uppercase tracking-wider mb-4">Full Stack Developer</p>
                  <p className="text-muted-foreground text-sm mb-6 font-light">
                    热爱开源，热衷于探索前沿技术。
                    <br />
                    构建优雅的代码，创造有价值的产品。
                  </p>

                  <div className="flex justify-center gap-3">
                    <a href="https://github.com/slxr925" target="_blank" title="GitHub" rel="noopener noreferrer" className="p-2 text-muted-foreground hover:text-foreground border border-border hover:border-accent rounded-sm transition-all">
                      <Github className="w-4 h-4" />
                    </a>
                    <a href="mailto:slxr@outlook.com" title="Email" className="p-2 text-muted-foreground hover:text-foreground border border-border hover:border-accent rounded-sm transition-all">
                      <Mail className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div variants={item}>
              <div className="border border-border p-6 bg-card">
                <h3 className="font-mono-display text-xs uppercase tracking-wider mb-4 text-muted-foreground flex items-center gap-2">
                  <Database className="w-4 h-4 text-accent" />
                  数据概览
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {statCards.map((stat) => (
                    <div key={stat.label} className={`border border-border p-4 ${stat.className}`.trim()}>
                      <div className="text-2xl font-bold text-foreground">
                        {statsLoading ? (
                          <span className="inline-block h-8 w-20 animate-pulse bg-muted/70" />
                        ) : statsError ? (
                          '--'
                        ) : (
                          formatStatValue(stat.value)
                        )}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground font-mono-display uppercase tracking-wider">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
                {statsError && (
                  <p className="mt-4 text-xs text-destructive font-mono-display uppercase tracking-wider">
                    {statsError}
                  </p>
                )}
              </div>
            </motion.div>

            {/* Acknowledgments */}
            <motion.div variants={item}>
              <div className="border border-border p-6 text-center bg-card">
                <Heart className="w-6 h-6 text-accent mx-auto mb-3" />
                <p className="text-muted-foreground text-sm font-light">
                  感谢每一位访问者
                </p>
                <p className="text-xs text-muted-foreground/60 mt-2 font-mono-display uppercase tracking-wider">
                  Made with care by Ryan
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default About;
