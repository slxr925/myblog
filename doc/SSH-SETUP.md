# 🔐 SSH 密钥配置指南

> 5分钟配置，实现免密码一键部署

## 🎯 为什么要配置 SSH 密钥？

**配置前：**
```bash
# 每次部署都要输入密码
scp file.jar root@server:/path/
Password: ********
ssh root@server "deploy command"
Password: ********
```

**配置后：**
```bash
# 一条命令搞定，无需密码
./deploy/deploy-update.sh
```

**好处：**
- ✅ 无需每次输入密码
- ✅ 更安全（密钥比密码更难破解）
- ✅ 支持自动化部署
- ✅ 节省时间（每次部署节省10分钟）

---

## 🚀 快速配置（5分钟）

### macOS / Linux 用户

#### 步骤 1：生成 SSH 密钥

```bash
# 检查是否已有密钥
ls -la ~/.ssh/id_rsa.pub

# 如果没有，生成新密钥
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 提示时一路回车即可（使用默认路径和空密码）
```

**输出示例：**
```
Generating public/private rsa key pair.
Enter file in which to save the key (/Users/you/.ssh/id_rsa): [回车]
Enter passphrase (empty for no passphrase): [回车]
Enter same passphrase again: [回车]
Your identification has been saved in /Users/you/.ssh/id_rsa
Your public key has been saved in /Users/you/.ssh/id_rsa.pub
```

#### 步骤 2：复制公钥到服务器

**方法一：使用 ssh-copy-id（推荐）**
```bash
ssh-copy-id root@49.235.139.118
```

**方法二：手动复制**
```bash
cat ~/.ssh/id_rsa.pub | ssh root@49.235.139.118 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys'
```

#### 步骤 3：测试免密登录

```bash
ssh root@49.235.139.118
```

如果不需要输入密码直接登录，说明配置成功！ 🎉

---

### Windows 用户

#### 步骤 1：生成 SSH 密钥

**使用 PowerShell：**

```powershell
# 检查是否已有密钥
Test-Path $env:USERPROFILE\.ssh\id_rsa.pub

# 生成新密钥
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
# 一路回车
```

**使用 Git Bash：**

```bash
# 打开 Git Bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
# 一路回车
```

#### 步骤 2：复制公钥到服务器

**使用 PowerShell：**

```powershell
# 方法一：一键复制
type $env:USERPROFILE\.ssh\id_rsa.pub | ssh root@49.235.139.118 "cat >> .ssh/authorized_keys"

# 方法二：手动复制
# 1. 查看公钥
Get-Content $env:USERPROFILE\.ssh\id_rsa.pub

# 2. 登录服务器
ssh root@49.235.139.118

# 3. 在服务器上执行
mkdir -p ~/.ssh
vim ~/.ssh/authorized_keys
# 粘贴公钥内容，保存退出

# 4. 设置权限
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

**使用 Git Bash：**

```bash
cat ~/.ssh/id_rsa.pub | ssh root@49.235.139.118 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys'
```

#### 步骤 3：测试免密登录

```powershell
ssh root@49.235.139.118
```

如果不需要输入密码直接登录，说明配置成功！ 🎉

---

## 🔧 详细配置步骤

### 1. 生成 SSH 密钥对

SSH 密钥对包含：
- **私钥** (`id_rsa`)：保存在本地，绝不共享
- **公钥** (`id_rsa.pub`)：复制到服务器

**生成命令：**
```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

**参数说明：**
- `-t rsa`：使用 RSA 算法
- `-b 4096`：密钥长度 4096 位（更安全）
- `-C "comment"`：添加注释（通常是邮箱）

**交互提示：**

```
Enter file in which to save the key (/Users/you/.ssh/id_rsa):
```
→ 回车使用默认路径

```
Enter passphrase (empty for no passphrase):
```
→ 回车不设置密码（或输入密码，每次使用时需要输入）

```
Enter same passphrase again:
```
→ 再次回车确认

### 2. 查看公钥

```bash
cat ~/.ssh/id_rsa.pub
```

**输出示例：**
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDExampleKeyContent... your_email@example.com
```

### 3. 复制公钥到服务器

#### 方法一：ssh-copy-id（Linux/macOS 推荐）

```bash
ssh-copy-id -i ~/.ssh/id_rsa.pub root@49.235.139.118
```

**首次需要输入服务器密码**

#### 方法二：手动复制（通用）

```bash
# 1. 显示公钥
cat ~/.ssh/id_rsa.pub

# 2. 复制输出内容

# 3. 登录服务器
ssh root@49.235.139.118

# 4. 在服务器上创建目录和文件
mkdir -p ~/.ssh
vim ~/.ssh/authorized_keys

# 5. 粘贴公钥内容（按 i 进入编辑模式，粘贴，按 Esc，输入 :wq 保存）

# 6. 设置正确的权限（重要！）
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

#### 方法三：一键命令（Linux/macOS）

```bash
cat ~/.ssh/id_rsa.pub | ssh root@49.235.139.118 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys'
```

### 4. 测试连接

```bash
ssh root@49.235.139.118
```

**成功：**
- 不需要输入密码直接登录

**失败：**
- 仍然要求输入密码 → 参见下方故障排查

---

## ❓ 常见问题

### 问题 1：仍然要求输入密码

**可能原因：**
1. 公钥没有正确复制到服务器
2. 权限设置不正确
3. SSH 配置禁用了公钥认证

**解决方案：**

```bash
# 登录服务器检查
ssh root@49.235.139.118

# 检查 authorized_keys 文件
cat ~/.ssh/authorized_keys

# 检查权限
ls -la ~/.ssh/
# 应该显示：
# drwx------   .ssh
# -rw-------   authorized_keys

# 如果权限不对，修正：
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# 检查 SSH 配置
sudo vim /etc/ssh/sshd_config

# 确保以下配置未被注释且值正确：
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

# 重启 SSH 服务
sudo systemctl restart sshd
```

### 问题 2：permission denied (publickey)

**解决方案：**

```bash
# 检查本地私钥权限
ls -la ~/.ssh/id_rsa
# 应该是: -rw-------

# 修正权限
chmod 600 ~/.ssh/id_rsa

# 检查 SSH agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_rsa
```

### 问题 3：多个密钥管理

如果你有多个服务器，需要不同的密钥：

```bash
# 生成特定名称的密钥
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_myblog

# 创建 SSH 配置文件
vim ~/.ssh/config

# 添加配置
Host myblog-server
    HostName 49.235.139.118
    User root
    IdentityFile ~/.ssh/id_rsa_myblog

# 使用别名连接
ssh myblog-server
```

### 问题 4：Windows 找不到 ssh-keygen

**解决方案：**

```powershell
# 安装 OpenSSH（Windows 10/11）
# 设置 → 应用 → 可选功能 → 添加功能 → OpenSSH 客户端

# 或使用 Git Bash
# 下载并安装 Git for Windows
# https://git-scm.com/download/win
```

---

## 🔒 安全最佳实践

### 1. 保护私钥

```bash
# 私钥权限必须是 600
chmod 600 ~/.ssh/id_rsa

# 不要共享私钥
# 不要上传到 Git
# 不要发送给任何人
```

### 2. 使用密码保护私钥（可选）

```bash
# 生成时设置密码
ssh-keygen -t rsa -b 4096
# 输入密码时不要回车，输入你的密码

# 使用 ssh-agent 避免每次输入密码
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_rsa
# 输入密码（只需一次）
```

### 3. 定期更换密钥

```bash
# 建议每年更换一次
# 生成新密钥
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_new

# 复制到服务器
ssh-copy-id -i ~/.ssh/id_rsa_new.pub root@server

# 测试新密钥
ssh -i ~/.ssh/id_rsa_new root@server

# 替换旧密钥
mv ~/.ssh/id_rsa_new ~/.ssh/id_rsa
mv ~/.ssh/id_rsa_new.pub ~/.ssh/id_rsa.pub
```

### 4. 禁用密码登录（推荐）

配置成功后，可以禁用密码登录提高安全性：

```bash
# 登录服务器
ssh root@49.235.139.118

# 编辑 SSH 配置
sudo vim /etc/ssh/sshd_config

# 修改以下配置
PasswordAuthentication no
ChallengeResponseAuthentication no

# 重启 SSH
sudo systemctl restart sshd
```

⚠️ **注意：** 禁用密码登录前，确保至少有一个密钥能正常登录！

---

## 📝 SSH 配置文件示例

### 本地 ~/.ssh/config

```bash
# MyBlog 生产服务器
Host myblog-prod
    HostName 49.235.139.118
    User root
    IdentityFile ~/.ssh/id_rsa
    ServerAliveInterval 60

# MyBlog 测试服务器
Host myblog-test
    HostName test.example.com
    User deploy
    IdentityFile ~/.ssh/id_rsa_test
    Port 2222

# 默认配置
Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

**使用别名连接：**
```bash
ssh myblog-prod
scp file.jar myblog-prod:/path/
```

---

## ✅ 验证清单

配置完成后，检查以下项目：

- [ ] 本地已生成密钥对（~/.ssh/id_rsa 和 id_rsa.pub）
- [ ] 公钥已复制到服务器（~/.ssh/authorized_keys）
- [ ] 私钥权限正确（600）
- [ ] 服务器 .ssh 目录权限正确（700）
- [ ] authorized_keys 权限正确（600）
- [ ] 可以免密码登录服务器
- [ ] deploy-update.sh 脚本可以正常使用

---

## 🎉 成功配置后

现在你可以：

```bash
# 一键部署
./deploy/deploy-update.sh

# 免密登录
ssh root@49.235.139.118

# 快速传输文件
scp file.jar root@49.235.139.118:/path/
```

**享受一键部署的便捷！** 🚀

---

## 📞 获取帮助

遇到问题？

1. 查看本文档的「常见问题」章节
2. 查看服务器 SSH 日志：`sudo tail -f /var/log/auth.log`
3. 提交 Issue 或联系技术支持

---

**最后更新：** 2025-12-18
