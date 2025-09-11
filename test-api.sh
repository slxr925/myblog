#!/bin/bash

# 博客系统API测试脚本
BASE_URL="http://localhost:9999"

echo "=== 博客系统API测试 ==="

# 1. 测试用户注册
echo "1. 测试用户注册..."
REGISTER_RESPONSE=$(curl -s -X POST \
  "${BASE_URL}/api/user/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "password123",
    "email": "newuser@example.com",
    "nickname": "新用户"
  }')

echo "注册响应: ${REGISTER_RESPONSE}"

# 2. 测试用户登录
echo -e "\n2. 测试用户登录..."
LOGIN_RESPONSE=$(curl -s -X POST \
  "${BASE_URL}/api/user/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "user123"
  }')

echo "登录响应: ${LOGIN_RESPONSE}"

# 提取JWT token（如果登录成功）
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"data":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$TOKEN" ]; then
    echo "获取到JWT Token: ${TOKEN:0:50}..."
    
    # 3. 测试获取用户信息
    echo -e "\n3. 测试获取用户信息..."
    USER_INFO_RESPONSE=$(curl -s -X GET \
      "${BASE_URL}/api/user/info" \
      -H "Authorization: Bearer ${TOKEN}")
    
    echo "用户信息响应: ${USER_INFO_RESPONSE}"
    
    # 4. 测试获取分类列表
    echo -e "\n4. 测试获取分类列表..."
    CATEGORY_RESPONSE=$(curl -s -X GET \
      "${BASE_URL}/api/category/list")
    
    echo "分类列表响应: ${CATEGORY_RESPONSE}"
    
    # 5. 测试获取博客列表（分页）
    echo -e "\n5. 测试获取博客列表..."
    BLOG_LIST_RESPONSE=$(curl -s -X GET \
      "${BASE_URL}/api/blog/page?page=1&size=5")
    
    echo "博客列表响应: ${BLOG_LIST_RESPONSE}"
fi

echo -e "\n=== 测试完成 ==="