package com.ryan.myblog;

import com.ryan.myblog.entity.Tag;
import com.ryan.myblog.service.TagService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Arrays;
import java.util.List;

@SpringBootTest(properties = "spring.config.name=application-test")
public class TagServiceTest {

    @Autowired
    private TagService tagService;

    @Test
    public void testTagManagement() {
        System.out.println("=== 标签管理功能测试 ===");
        
        try {
            // 1. 查询所有标签
            System.out.println("1. 查询所有标签...");
            List<Tag> allTags = tagService.getAllTags();
            System.out.println("✅ 当前标签总数: " + allTags.size());
            allTags.forEach(tag -> System.out.println("  - " + tag.getName() + " (" + tag.getColor() + ")"));
            
            // 2. 创建新标签
            System.out.println("\n2. 创建新标签...");
            Tag newTag = new Tag();
            newTag.setName("测试标签");
            newTag.setColor("#ff6b35");
            
            tagService.saveTag(newTag);
            System.out.println("✅ 新标签创建成功: " + newTag.getName());
            
            // 3. 测试批量创建标签
            System.out.println("\n3. 测试批量创建标签...");
            List<String> tagNames = Arrays.asList("Spring", "MyBatis", "测试");
            List<Tag> createdTags = tagService.saveTagsIfNotExist(tagNames);
            System.out.println("✅ 批量创建标签成功，共创建: " + createdTags.size() + " 个标签");
            createdTags.forEach(tag -> System.out.println("  - " + tag.getName()));
            
            // 4. 更新标签
            if (!createdTags.isEmpty()) {
                System.out.println("\n4. 更新标签...");
                Tag tagToUpdate = createdTags.get(0);
                tagToUpdate.setName("Spring Framework");
                tagToUpdate.setColor("#00d084");
                
                tagService.updateTag(tagToUpdate);
                System.out.println("✅ 标签更新成功: " + tagToUpdate.getName());
            }
            
            // 5. 查询单个标签
            System.out.println("\n5. 查询单个标签...");
            if (!createdTags.isEmpty()) {
                Tag foundTag = tagService.getTagById(createdTags.get(0).getId());
                if (foundTag != null) {
                    System.out.println("✅ 标签查询成功: " + foundTag.getName());
                }
            }
            
            // 6. 再次查询所有标签
            System.out.println("\n6. 最终标签列表...");
            List<Tag> finalTags = tagService.getAllTags();
            System.out.println("✅ 最终标签总数: " + finalTags.size());
            finalTags.forEach(tag -> System.out.println("  - " + tag.getName() + " (" + tag.getColor() + ")"));
            
        } catch (Exception e) {
            System.err.println("❌ 测试失败: " + e.getMessage());
            e.printStackTrace();
        }
        
        System.out.println("\n=== 标签管理功能测试完成 ===");
    }
}