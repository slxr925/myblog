// 兼容层：统一类型定义来源到 types/api.ts，避免重复定义漂移。

export type {
  BlogDetailVO,
  BlogDetailEnhancedVO,
  CommentVO,
  CommentCreateDTO,
} from './api';

export { BlogStatus, Role as UserRole } from './api';
