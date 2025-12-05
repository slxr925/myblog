# SSH 密钥配置指南

配置SSH密钥后，可以实现免密码登录和自动化部署。

## 快速配置（5分钟）

### 1. 生成SSH密钥（如果没有）

```bash
# 检查是否已有密钥
ls -la ~/.ssh/id_rsa.pub

# 如果没有，生成新密钥
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
# 一路按Enter（使用默认路径，不设置密码短语）
```

### 2. 复制公钥到服务器

```bash
# 方法1：使用 ssh-copy-id（推荐）
ssh-copy-id root@49.235.139.118

# 方法2：手动复制
cat ~/.ssh/id_rsa.pub | ssh root@49.235.139.118 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"

# 方法3：通过宝塔面板
# 1. 复制本地公钥内容
cat ~/.ssh/id_rsa.pub
# 2. 登录宝塔面板 -> SSH管理 -> 密钥管理
# 3. 粘贴公钥内容并保存
```

### 3. 测试连接

```bash
# 测试SSH连接（应该不需要输入密码）
ssh root@49.235.139.118 "echo '连接成功'"

# 如果成功，你会看到 "连接成功"
```

### 4. 配置SSH快捷方式（可选）

编辑 `~/.ssh/config`：

```bash
Host myblog
    HostName 49.235.139.118
    User root
    Port 22
    IdentityFile ~/.ssh/id_rsa
```

保存后，可以用简短命令连接：

```bash
# 原来：ssh root@49.235.139.118
# 现在：ssh myblog

# 原来：scp file.txt root@49.235.139.118:/path/
# 现在：scp file.txt myblog:/path/
```

## 故障排查

### 问题1: Permission denied (publickey)

```bash
# 检查服务器权限
ssh root@49.235.139.118
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### 问题2: 仍然提示输入密码

```bash
# 检查本地密钥
ls -la ~/.ssh/id_rsa*

# 手动指定密钥
ssh -i ~/.ssh/id_rsa root@49.235.139.118
```

### 问题3: 宝塔面板SSH安全设置

如果服务器使用宝塔面板：
1. 登录宝塔面板
2. 安全 -> SSH安全 -> 确保允许密钥登录
3. 防火墙 -> 确保SSH端口（22）开放

## 使用一键部署

配置完SSH密钥后，可以使用一键部署脚本：

```bash
cd /Users/xuran/Dev/myblog
./deploy-update.sh
```

这个脚本会自动：
- ✅ 本地构建
- ✅ 上传jar和dist
- ✅ 服务器部署
- ✅ 健康检查

整个过程约3-5分钟完成！🚀

