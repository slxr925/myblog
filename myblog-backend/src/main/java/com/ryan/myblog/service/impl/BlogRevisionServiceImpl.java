package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ryan.myblog.mapper.BlogMapper;
import com.ryan.myblog.mapper.BlogRevisionMapper;
import com.ryan.myblog.model.entity.Blog;
import com.ryan.myblog.model.entity.BlogRevision;
import com.ryan.myblog.model.vo.BlogRevisionDiffVO;
import com.ryan.myblog.model.vo.BlogRevisionVO;
import com.ryan.myblog.service.BlogRevisionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BlogRevisionServiceImpl implements BlogRevisionService {

    private final BlogRevisionMapper revisionMapper;
    private final BlogMapper blogMapper;

    @Override
    public void createRevision(Blog blog, Long authorId) {
        if (blog == null || blog.getId() == null) {
            return;
        }
        Integer nextVersion = getNextVersion(blog.getId());
        BlogRevision revision = new BlogRevision();
        revision.setBlogId(blog.getId());
        revision.setVersion(nextVersion);
        revision.setTitle(blog.getTitle());
        revision.setSummary(blog.getSummary());
        revision.setContent(blog.getContent());
        revision.setAuthorId(authorId != null ? authorId : blog.getAuthorId());
        revisionMapper.insert(revision);
    }

    @Override
    public List<BlogRevisionVO> listRevisions(Long blogId) {
        LambdaQueryWrapper<BlogRevision> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(BlogRevision::getBlogId, blogId).orderByDesc(BlogRevision::getVersion);
        return revisionMapper.selectList(wrapper).stream().map(this::toVO).collect(Collectors.toList());
    }

    @Override
    public BlogRevisionDiffVO diffRevisions(Long fromRevisionId, Long toRevisionId) {
        BlogRevision from = revisionMapper.selectById(fromRevisionId);
        BlogRevision to = revisionMapper.selectById(toRevisionId);
        if (from == null || to == null) {
            throw new RuntimeException("版本不存在");
        }
        BlogRevisionDiffVO diff = new BlogRevisionDiffVO();
        diff.setFromRevisionId(fromRevisionId);
        diff.setToRevisionId(toRevisionId);
        diff.setFromTitle(from.getTitle());
        diff.setToTitle(to.getTitle());
        diff.setFromSummary(from.getSummary());
        diff.setToSummary(to.getSummary());
        diff.setFromContentSnippet(snippet(from.getContent()));
        diff.setToContentSnippet(snippet(to.getContent()));
        diff.setTitleChanged(!safeEquals(from.getTitle(), to.getTitle()));
        diff.setSummaryChanged(!safeEquals(from.getSummary(), to.getSummary()));
        diff.setContentChanged(!safeEquals(from.getContent(), to.getContent()));
        return diff;
    }

    @Override
    @Transactional
    public void restoreRevision(Long revisionId, Long operatorId) {
        BlogRevision revision = revisionMapper.selectById(revisionId);
        if (revision == null) {
            throw new RuntimeException("版本不存在");
        }
        Blog blog = blogMapper.selectById(revision.getBlogId());
        if (blog == null) {
            throw new RuntimeException("博客不存在");
        }
        blog.setTitle(revision.getTitle());
        blog.setSummary(revision.getSummary());
        blog.setContent(revision.getContent());
        blog.setUpdateTime(LocalDateTime.now());
        blogMapper.updateById(blog);

        // 创建新的版本记录（恢复操作）
        createRevision(blog, operatorId != null ? operatorId : blog.getAuthorId());

        // 同步搜索索引（由定时或管理员重建）
    }

    private Integer getNextVersion(Long blogId) {
        LambdaQueryWrapper<BlogRevision> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(BlogRevision::getBlogId, blogId).orderByDesc(BlogRevision::getVersion).last("LIMIT 1");
        BlogRevision latest = revisionMapper.selectOne(wrapper);
        return latest == null ? 1 : latest.getVersion() + 1;
    }

    private BlogRevisionVO toVO(BlogRevision revision) {
        BlogRevisionVO vo = new BlogRevisionVO();
        vo.setId(revision.getId());
        vo.setBlogId(revision.getBlogId());
        vo.setVersion(revision.getVersion());
        vo.setTitle(revision.getTitle());
        vo.setSummary(revision.getSummary());
        vo.setAuthorId(revision.getAuthorId());
        vo.setCreateTime(revision.getCreateTime());
        return vo;
    }

    private String snippet(String content) {
        if (content == null) {
            return "";
        }
        String normalized = content.replaceAll("\\s+", " ").trim();
        return normalized.length() > 200 ? normalized.substring(0, 200) + "..." : normalized;
    }

    private boolean safeEquals(String a, String b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        return a.equals(b);
    }
}
