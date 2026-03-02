# SSH 免密配置指南

用于生产部署脚本的无交互连接。

## 1. 生成密钥（本地）

```bash
ssh-keygen -t rsa -b 4096 -C "deploy-key"
```

> 建议为项目单独生成密钥并设置注释。

## 2. 分发公钥到目标主机

```bash
ssh-copy-id <DEPLOY_USER>@<DEPLOY_HOST>
```

## 3. 验证连接

```bash
ssh <DEPLOY_USER>@<DEPLOY_HOST>
```

若无需输入账户密码即可登录，说明配置完成。

## 4. 可选：配置 SSH 别名

`~/.ssh/config` 示例：

```text
Host myblog-prod
  HostName <DEPLOY_HOST>
  User <DEPLOY_USER>
  IdentityFile ~/.ssh/<KEY_FILE>
```

之后可用：

```bash
ssh myblog-prod
```

## 5. 安全建议

- 私钥文件权限设为 `600`
- 不要把私钥提交到代码仓库
- 定期轮换密钥
- 离职或权限变更时立即回收授权
