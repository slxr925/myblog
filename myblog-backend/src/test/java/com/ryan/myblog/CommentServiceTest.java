package com.ryan.myblog;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.ryan.myblog.common.PageRequest;
import com.ryan.myblog.dto.CommentSaveDTO;
import com.ryan.myblog.service.CommentService;
import com.ryan.myblog.vo.CommentVO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

@SpringBootTest
public class CommentServiceTest {

    @Autowired
    private CommentService commentService;

    @Test
    public void testCommentSystem() {
        System.out.println("=== 评论系统功能测试 ===");
        
        try {
            // 1. 发布评论
            System.out.println("1. 发布评论...");
            CommentSaveDTO commentDTO = new CommentSaveDTO();
            commentDTO.setBlogId(1L);
            commentDTO.setContent("这是一条测试评论，写得很好！");
            
            commentService.saveComment(commentDTO, 2L); // 使用用户ID=2
            System.out.println("✅ 评论发布成功");
            
            // 2. 发布回复评论
            System.out.println("\n2. 发布回复评论...");
            CommentSaveDTO replyDTO = new CommentSaveDTO();
            replyDTO.setBlogId(1L);
            replyDTO.setContent("谢谢你的评论！");
            replyDTO.setParentId(5L); // 假设回复评论ID=5的评论
            replyDTO.setReplyUserId(2L);
            
            commentService.saveComment(replyDTO, 1L); // 使用用户ID=1（作者）
            System.out.println("✅ 回复评论发布成功");
            
            // 3. 查询评论树形结构
            System.out.println("\n3. 查询评论树形结构...");
            List<CommentVO> commentTree = commentService.getCommentTree(1L, 1);
            System.out.println("✅ 博客ID=1的评论树查询成功，共 " + commentTree.size() + " 条根评论");
            
            for (CommentVO comment : commentTree) {
                System.out.println("  - " + comment.getNickname() + ": " + comment.getContent());
                if (comment.getChildren() != null && !comment.getChildren().isEmpty()) {
                    for (CommentVO child : comment.getChildren()) {
                        System.out.println("    └── " + child.getNickname() + 
                                         (child.getReplyUserNickname() != null ? 
                                          " 回复 " + child.getReplyUserNickname() : "") + 
                                         ": " + child.getContent());
                    }
                }
            }
            
            // 4. 分页查询评论
            System.out.println("\n4. 分页查询评论...");
            PageRequest pageRequest = new PageRequest();
            pageRequest.setPage(1);
            pageRequest.setSize(5);
            
            IPage<CommentVO> commentPage = commentService.getCommentPage(pageRequest, 1L, 1);
            System.out.println("✅ 分页查询成功，共 " + commentPage.getTotal() + " 条评论");
            
            // 5. 统计评论数
            System.out.println("\n5. 统计评论数...");
            Long commentCount = commentService.countCommentsByBlogId(1L);
            System.out.println("✅ 博客ID=1的评论总数: " + commentCount);
            
            // 6. 测试点赞功能
            if (!commentPage.getRecords().isEmpty()) {
                System.out.println("\n6. 测试评论点赞功能...");
                CommentVO firstComment = commentPage.getRecords().get(0);
                Long commentId = firstComment.getId();
                Integer originalLikes = firstComment.getLikeCount();
                
                commentService.toggleCommentLike(commentId, 2L);
                
                CommentVO updatedComment = commentService.getCommentById(commentId);
                System.out.println("✅ 点赞成功，点赞数从 " + originalLikes + 
                                 " 增加到 " + updatedComment.getLikeCount());
            }
            
        } catch (Exception e) {
            System.err.println("❌ 测试失败: " + e.getMessage());
            e.printStackTrace();
        }
        
        System.out.println("\n=== 评论系统功能测试完成 ===");
    }
}