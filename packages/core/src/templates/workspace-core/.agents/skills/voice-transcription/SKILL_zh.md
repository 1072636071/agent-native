---
name: voice-transcription
description: >-
  代理侧栏编辑器中的框架级语音听写。在更改编辑器麦克风 UX、transcribe-voice
  路由或语音转录设置部分时使用。涵盖转录源路由、清理路由、Google 实时门控和语音转录应用状态键。
metadata:
  internal: true
---

# 语音转录

侧栏编辑器中的点击切换麦克风将语音转换为文本。用户在设置 → 语音转录中分别配置实时转录和 AI 清理。该功能在渲染 `TiptapComposer` 的每个模板中都可用。

## UX 规则

- **始终在发送按钮旁显示麦克风。** Cursor 在编辑器为空时用麦克风替换发送按钮；他们的用户会抱怨。我们保持两者都可见 — Lovable 也是这样做的。
- **点击切换，而非按住说话。** 在侧栏中更宽容，避免宿主应用热键冲突。键盘快捷键是 `Cmd/Ctrl+Shift+M`，`Escape` 取消录制中。
- **转录文本进入编辑器，可编辑，永不自动发送。** 通过 `editor.chain().focus().insertContent(text).run()` 在光标处插入。
- **录制状态不使用 CSS 过渡。** 框架规则；使用静态品牌色（`#625DF5`）而非脉冲。
- **图标：** Tabler `IconMicrophone`（空闲）/ `IconPlayerStopFilled`（录制中）。永不使用闪光或机器人图标。
- **错误通过内联提示或 toast，永不使用 `window.alert`。**

## 来源和清理

设置必须将这两项保持为独立选择：

- **实时转录源**：`mac-native`、`google-realtime` 或 `batch`。
- **AI 清理**：独立的开关切换。清理在配置了托管 AI 服务连接时优先使用托管 Gemini，然后使用 BYOK Gemini（`GEMINI_API_KEY`）。Gemini 清理/标题/摘要生成不是实时 STT 源。

`application_state["voice-transcription-prefs"]` 存储 `{ transcriptionMode, provider, instructions }`。旧版 `provider` 字段仍为旧客户端和批量提供商偏好写入：

| 值                  | 含义                                                        | 需要密钥                    |
| ------------------- | ----------------------------------------------------------- | --------------------------- |
| `mac-native`        | 原生 macOS/Tauri 语音路径；Web 客户端在需要时规范化为浏览器原生 | 否                          |
| `google-realtime`   | 专用 WebSocket → Google Speech-to-Text gRPC `StreamingRecognize` 路径 | `GOOGLE_APPLICATION_CREDENTIALS` |
| `batch`             | 停止后通过现有批量路由上传音频                               | Builder/Gemini/Groq/OpenAI 取决于回退 |
| `auto` provider     | 浏览器支持时使用 SpeechRecognition；否则服务器批量回退链     | 支持 SpeechRecognition 的浏览器无需密钥 |
| `builder-gemini`    | 托管 Gemini Flash-Lite 批量/清理偏好                         | 已连接托管 AI 服务账户      |
| `gemini`            | 直接 Google Gemini BYOK 批量/清理偏好                        | `GEMINI_API_KEY`            |
| `groq`              | Groq Whisper 批量偏好                                       | `GROQ_API_KEY`              |
| `openai`            | OpenAI Whisper 批量偏好                                     | `OPENAI_API_KEY`            |
| `browser`           | 旧版原生/浏览器实时语音偏好                                  | 否                          |

默认行为：

- 共享 Web 设置/编辑器默认为 Batch / `auto`。在 `auto` 模式下，`useVoiceDictation` 在浏览器支持 `SpeechRecognition` 时使用 `startBrowser()`（Web Speech API，无需密钥，增量流式传输）。仅在 `SpeechRecognition` 不可用时（如 Firefox）才回退到 MediaRecorder → 服务器上传路径。这意味着听写在 Chrome、Edge 和 Safari 中无需任何 API 密钥配置即可开箱即用。
- 专用的 macOS Tauri 原生界面可以保存 `mac-native`，但不要假设共享 React 设置默认为它。
- 旧版存储的 `builder` 值被视为 `builder-gemini`。
- 旧版存储的 `browser` 值被视为 `mac-native`。
- 保存的 `google-realtime` 偏好必须永不访问 `/_agent-native/transcribe-voice`。它们通过专用的会话桥接 `POST /_agent-native/transcribe-stream/session`，该桥接创建一个不透明的 ai-services websocket 会话，并将 Google 服务账户 JSON 保留在客户端之外。
- 在当前桥接中，Google 选项仅当用户的 `GOOGLE_APPLICATION_CREDENTIALS` 密钥存在且配置了托管 AI 服务连接时才真正就绪，因为框架在流式传输开始之前创建托管 ai-services 会话。

## 各部分所在位置

| 文件                                                                  | 用途                                             |
| --------------------------------------------------------------------- | ------------------------------------------------ |
| `packages/core/src/client/composer/useVoiceDictation.ts`              | 提供商路由钩子（MediaRecorder / Web Speech）     |
| `packages/core/src/client/composer/VoiceButton.tsx`                   | 麦克风按钮 + 实时振幅 + 取消覆盖层              |
| `packages/core/src/client/composer/TiptapComposer.tsx`                | 连接钩子、插入和键盘快捷键                       |
| `packages/core/src/client/settings/VoiceTranscriptionSection.tsx`     | 侧栏设置中的实时源 + 清理控制                    |
| `packages/core/src/client/transcription/BuilderTranscriptionCta.tsx`  | Builder 账户未连接时显示的 CTA                   |
| `packages/core/src/client/transcription/use-live-transcription.ts`    | 录制的 Web Speech 实时转录钩子                   |
| `packages/core/src/server/transcribe-voice.ts`                        | 路由处理器（路由到 Builder/Gemini/Groq/Whisper） |
| `packages/core/src/transcription/builder-transcription.ts`            | Builder 代理转录客户端                           |
| `packages/core/src/secrets/register-framework-secrets.ts`             | 框架级提供商密钥注册                             |

## 密钥解析（服务器）

`transcribe-voice.ts` 仅用于批量。不要向此路由添加实时流式传输。Google Speech-to-Text 实时使用专用的音频帧协议：客户端音频帧 → `/_agent-native/transcribe-stream/session` → ai-services WebSocket → Google gRPC `StreamingRecognize` → 部分/最终转录事件。使用规范文档 URL：https://cloud.google.com/speech-to-text/v2/docs/streaming-recognize

批量路由基于用户的提供商偏好：

1. 如果 `builder-gemini` 且 `resolveHasBuilderPrivateKey()` → 通过 Builder 代理调用 `transcribeWithBuilder({ model: "gemini-3-1-flash-lite" })`，或在桌面客户端发送文本而非音频时使用 Builder Gemini Flash-Lite 清理实时原生/浏览器转录。
2. 如果 `builder` 且 `resolveHasBuilderPrivateKey()` → 旧版别名；优先使用 `builder-gemini`。
3. 如果 `gemini` → 解析 `GEMINI_API_KEY` 并调用直接 Google Gemini 路径。
4. 如果 `groq` → 解析 `GROQ_API_KEY` 并调用 Groq 的 Whisper 兼容端点。
5. 如果 `openai` → 解析 `OPENAI_API_KEY`：
   - `readAppSecret({ key: "OPENAI_API_KEY", scope: "user", scopeId: session.email })` — 用户的加密密钥。
   - `resolveCredential("OPENAI_API_KEY")` — 环境变量 + SQL 设置回退。

在自动模式 / 无偏好时，路由在 Builder 已连接时优先尝试 Builder Gemini Flash-Lite，然后是 Gemini BYOK、Groq 和 OpenAI。当请求包含 `instructions` 时，将它们传递给选定的 LLM 提供商。Gemini 在转录提示中使用它们，Builder 将它们作为转录/清理指令接收，Whisper 兼容提供商将它们作为提供商提示/上下文接收。

永远不要硬编码共享密钥。永远不要记录其值。永远不要将其回传给客户端。

## 按模板覆盖

模板可以：
- **禁用麦克风**：向 `TiptapComposer` 传递 `voiceEnabled={false}`。
- **替换按钮**：包装 `TiptapComposer` 并渲染自己的 `extraActionButton`（框架麦克风位于 `extraActionButton` 和发送按钮之间）。
- **将提供商密钥预注册为 `required: true`**：当模板在引导中需要特定 BYOK 提供商时，从自己的服务器插件调用 `registerRequiredSecret(...)`。

## 不要

- 不要从客户端调用转录提供商 — 通过 `/_agent-native/transcribe-voice` 以便用户的密钥保留在服务器端。
- 不要移除取消功能 — 麦克风权限滥用担忧是真实的。
- 不要自动提交转录文本 — 用户总是在发送前编辑。
- 不要复制 Cursor 的"为空时隐藏发送"模式 — 它会让用户困惑。