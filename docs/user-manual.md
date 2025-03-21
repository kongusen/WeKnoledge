# 用户手册

本手册将指导您如何使用WeKnoledge系统的各项功能。

## 目录

- [注册与登录](#注册与登录)
- [创建知识库](#创建知识库)
- [上传文档](#上传文档)
- [管理文档](#管理文档)
- [搜索与提问](#搜索与提问)
- [对话历史](#对话历史)
- [分享与协作](#分享与协作)
- [个人设置](#个人设置)

## 注册与登录

### 注册新账户

1. 访问WeKnoledge首页，点击右上角的"注册"按钮
2. 填写用户名、电子邮件和密码
3. 点击"创建账户"按钮
4. 检查您的电子邮箱，点击验证链接完成注册

### 登录账户

1. 点击右上角的"登录"按钮
2. 输入您的用户名或电子邮件以及密码
3. 点击"登录"按钮进入系统

### 找回密码

1. 在登录页面点击"忘记密码？"链接
2. 输入与您账户关联的电子邮件
3. 点击"发送重置链接"按钮
4. 在您的电子邮箱中查收密码重置链接，并按照指示完成重置

## 创建知识库

知识库是存储和组织文档的集合。您可以创建多个知识库来分类管理不同主题的文档。

### 创建新知识库

1. 登录后，进入"我的知识库"页面
2. 点击"创建知识库"按钮
3. 输入知识库名称和描述
4. 选择知识库访问权限（公开或私有）
5. 点击"创建"按钮完成

### 管理知识库

- **编辑知识库**：在知识库列表中找到目标知识库，点击"编辑"按钮修改名称、描述或访问权限
- **删除知识库**：点击知识库旁的"删除"按钮，在确认对话框中点击"确认删除"
- **查看知识库统计**：点击知识库名称进入详情页，查看文档数量、访问次数等统计信息

## 上传文档

您可以向知识库中上传各种格式的文档，系统会自动处理并使其可被搜索和提问。

### 支持的文件格式

- 文本文档：PDF, DOCX, TXT, RTF, MD
- 电子表格：XLSX, CSV
- 演示文稿：PPTX
- 网页：HTML
- 代码：各种编程语言文件

### 上传文档步骤

1. 进入目标知识库详情页
2. 点击"上传文档"按钮
3. 从本地选择文件，或拖放文件到上传区域
4. 填写文档标题和描述（可选）
5. 添加标签（可选，用于分类和快速查找）
6. 点击"开始上传"按钮

### 文档处理

上传后，文档将经历以下处理步骤：

1. **解析**：提取文本内容
2. **分块**：将文本分成适当大小的块
3. **向量化**：将文本块转换为向量嵌入
4. **索引**：添加到向量数据库中用于搜索

您可以在上传页面查看处理进度。处理完成后，文档状态将变为"已完成"，并可用于搜索和提问。

## 管理文档

### 查看文档列表

1. 进入知识库详情页
2. 文档列表显示所有已上传的文档，包括标题、上传日期、状态等信息

### 文档操作

- **查看详情**：点击文档标题查看详细信息，包括元数据和处理状态
- **预览**：点击"预览"按钮查看文档内容的在线预览
- **下载**：点击"下载"按钮获取原始文档
- **更新元数据**：点击"编辑"修改文档标题、描述或标签
- **删除**：点击"删除"按钮，在确认后移除文档

## 搜索与提问

WeKnoledge的核心功能是允许您基于知识库内容提问问题。

### 简单搜索

1. 在知识库详情页顶部的搜索框输入关键词
2. 系统将显示相关的文档和文档块

### 提问问题

1. 进入知识库的"聊天"标签页
2. 在底部输入框中输入您的问题
3. 点击发送按钮或按回车键
4. 系统将分析您的问题，搜索相关文档内容，并生成基于知识库的回答

### 高级提问技巧

- **提供上下文**：详细描述您的问题背景可以获得更准确的回答
- **精确提问**：明确、具体的问题比模糊的问题更容易得到精确答案
- **追问**：可以基于上一个回答继续提问，系统会保持上下文

## 对话历史

系统会保存您的所有对话历史，便于日后回顾和继续对话。

### 查看历史对话

1. 点击左侧菜单的"对话历史"
2. 浏览所有过去的对话，按时间排序
3. 点击任意对话继续或查看详情

### 对话管理

- **重命名对话**：点击对话标题旁的编辑图标，输入新名称
- **删除对话**：点击对话旁的删除图标，确认后永久删除该对话
- **导出对话**：在对话详情页，点击"导出"按钮保存对话内容为PDF或文本文件

## 分享与协作

WeKnoledge允许您与团队成员共享知识库和对话。

### 知识库共享

1. 在知识库详情页，点击"共享"按钮
2. 输入被邀请者的电子邮件地址
3. 选择权限级别（只读、可编辑、管理员）
4. 点击"发送邀请"

### 对话分享

1. 在对话详情页，点击"分享"按钮
2. 选择分享方式：
   - 生成链接（可设置访问密码和过期时间）
   - 直接发送给指定用户
3. 设置分享权限（只读或可回复）
4. 确认分享

## 个人设置

### 账户设置

1. 点击右上角头像，选择"设置"
2. 在"个人资料"标签页：
   - 更新头像
   - 修改用户名
   - 更改邮箱地址
   - 更新个人简介

### 安全设置

在"安全"标签页：
- 更改密码
- 设置两步验证
- 查看登录活动历史

### 通知设置

在"通知"标签页：
- 配置电子邮件通知偏好
- 设置系统内通知
- 订阅或取消订阅特定事件的通知

### API访问

在"API"标签页：
- 创建API密钥
- 管理现有API密钥
- 查看API使用统计

## 常见问题解答

### 文档上传问题

**Q: 为什么我的文档一直处于"处理中"状态？**  
A: 大型文档可能需要更长的处理时间。如果超过30分钟仍未完成，请尝试将文档分割成多个较小的文件重新上传。

**Q: 系统支持多大的文档？**  
A: 单个文档大小限制为100MB。对于超大文档，建议分割成多个小文件上传。

### 提问问题

**Q: 为什么我的问题没有得到准确回答？**  
A: 尝试重新表述您的问题，使其更加具体和清晰。确保您的知识库中包含相关信息。

**Q: 系统回答中提到"我不知道"？**  
A: 这表示您的知识库中可能没有足够的相关信息。考虑上传更多相关文档或重新表述问题。

### 账户问题

**Q: 如何删除我的账户？**  
A: 在"设置"页面的"账户"标签下，找到"删除账户"选项。请注意，此操作不可逆，将永久删除您的所有数据。 