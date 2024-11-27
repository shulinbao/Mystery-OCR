# Mystery-OCR

Mystery-OCR 是一个基于 Cloudflare Worker 部署的轻量级服务，用于实现图片 OCR (光学字符识别) 以及简单的结果展示和处理。通过提供图片，该服务会返回解析后的文本信息以及可视化的 SVG 多边形结果。

## 功能特性

- **图片上传**：支持通过网页上传图片文件。
- **OCR 解析**：调用外部 API 进行图片 OCR 解析，返回识别的文本和坐标信息。
- **SVG 显示**：将 OCR 结果以多边形和文本的形式绘制在网页上。
- **文本提取**：提供纯文本的解析结果。
- **结果复制**：一键复制 OCR 解析结果到剪贴板。

## 部署步骤

1. **创建 Cloudflare Worker**
   - 登录到 [Cloudflare Dashboard](https://dash.cloudflare.com/)，进入 Workers 页面。
   - 创建一个新的 Worker，并将项目代码复制粘贴到 Worker 的编辑器中。

2. **设置环境变量**
   - 在 Worker 的 `Settings` 页面中，添加以下环境变量：
     - `SECRET_ID`：API 调用所需的 Secret ID，参见环境变量说明部分。
     - `API_KEY`：API 调用所需的 API Key，参见环境变量说明部分。
     - `ENDPOINT`：目标 OCR API 的请求地址，参见环境变量说明部分。

3. **保存并部署**
   - 保存 Worker 代码并点击 “Deploy” 按钮将服务部署。

## 环境变量说明

| 变量名称  | 内容                                                         |
|-----------|--------------------------------------------------------------|
| `SECRET_ID` | API 的 Secret ID，例如 `Inner_40731a6efece4c2e992c0d670222e6da`。                                   |
| `API_KEY`   | API 的访问密钥，本项目不提供，请参考 [这个链接](https://linux.do/t/topic/78300/69)。                                     |
| `ENDPOINT`  | OCR API 的服务地址，例如 `http://ai.chaoxing.com/api/v1/ocr/common/sync`。     |

## 使用方法

1. **访问服务**
   - 部署后，访问生成的 Worker URL。例如：`https://your-worker-name.workers.dev/`。

2. **上传图片**
   - 在页面上选择图片并点击 "Upload and Convert" 按钮，等待 OCR 解析完成。

3. **查看和复制结果**
   - 页面将展示 OCR 的 SVG 可视化结果和纯文本解析结果。
   - 点击 "Copy Result" 或 "Copy Text Result" 按钮可将结果复制到剪贴板。

## 技术细节

- **Worker 请求处理**
  - **GET 请求**：返回 HTML 页面，用于图片上传和结果展示。
  - **POST 请求**：处理图片数据，将 Base64 编码的图片发送至外部 API，并返回解析结果。

- **加密签名**
  - 使用 MD5 生成请求签名以确保 API 调用的安全性。

- **错误处理**
  - 若 API 返回非 JSON 数据，Worker 将捕获并返回友好的错误提示。

## 示例部署结果

![Sample](1.png)

---

如果您在部署或使用中遇到问题，请提交 Issue 或联系开发者。API 由第三方提供，开发者不为 API 的来源及可用性负责。
