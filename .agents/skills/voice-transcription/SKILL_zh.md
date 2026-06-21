---
name: voice-transcription
description: >-
  agent 侧边栏撰写器中的框架级语音听写。在更改撰写器麦克风 UX、transcribe-voice 路由或语音转录设置部分时使用。涵盖转录来源路由、清理路由、Google 实时门控和语音转录 application-state 键。
metadata:
  internal: true
---

# 语音转录

侧边栏撰写器内的点击切换麦克风将语音转为文本。用户在 Settings → Voice Transcription 中分别配置实时转录和 AI 清理。该功能在渲染 `TiptapComposer` 的每个模板中可用。

## UX 规则

- **始终在发送按钮旁显示麦克风。** Cursor 在撰写器为空时用麦克风替换发送按钮；他们的用户抱怨。我们保持两者可见 — Lovable 也是这样做的。
- **点击切换，非按住说话。** 在侧边栏中更宽容，避免宿主应用热键冲突。键盘快捷键为 `Cmd/Ctrl+Shift+M`，`Escape` 取消录音中。
- **转录文本进入撰写器，可编辑，永不自动发送。** 在光标处通过 `editor.chain().focus().insertContent(text).run()` 插入。
- **录音状态无 CSS 过渡。** 框架规则；使用静态品牌色（`#625DF5`）而非脉冲。
- **图标：** Tabler `IconMicrophone`（空闲）/ `IconPlayerStopFilled`（录音中）。切勿使用闪光或机器人图标。
- **错误通过内联警报或 toast，绝不 `window.alert`。**

## 来源和清理

设置必须将这两者保持为独立选择：

- **实时转录来源**：`mac-native`、`google-realtime` 或 `batch`。
- **AI 清理**：独立的开关切换。清理在配置了托管 AI 服务连接时优先使用托管 Gemini，然后是 BYOK Gemini（`GEMINI_API_KEY`）。Gemini 清理/标题/摘要生成不是实时 STT 来源。

`application_state["voice-transcription-prefs"]` 存储 `{ transcriptionMode, provider, instructions }`。遗留的 `provider` 字段仍为旧客户端和批处理 provider 偏好写入：

| 值                 | 含义                                                        | 需要密钥                    |
| ------------------ | ----------------------------------------------------------- | ---------------------------- |
| `mac-native`       | 原生 macOS/Tauri 语音路径；Web 客户端在需要时归一化为浏览器原生 | 否                           |
| `google-realtime`  | 专用 WebSocket → Google Speech-to-Text gRPC `StreamingRecognize` 路径 | `GOOGLE_APPLICATION_CREDENTIALS` |
| `batch`            | 停止后通过现有批处理路由上传音频                           | Builder/Gemini/Groq/OpenAI 取决于回退 |
| `auto` provider    | 支持时使用浏览器 SpeechRecognition；否则服务器批处理回退链 | 支持 SpeechRecognition 的浏览器无需密钥 |
| `builder-gemini`   | 托管 Gemini Flash-Lite 批处理/清理偏好                     | 托管 AI 服务账户已连接       |
| `gemini`           | 直接 Google Gemini BYOK 批处理/清理偏好                    | `GEMINI_API_KEY`             |
| `groq`             | Groq Whisper 批处理偏好                                    | `GROQ_API_KEY`               |
| `openai`           | OpenAI Whisper 批处理偏好                                  | `OPENAI_API_KEY`             |
| `browser`          | 遗留原生/浏览器实时语音偏好                                | 否                           |

默认行为：

- 共享 Web 设置/撰写器默认为 Batch / `auto`。在 `auto` 模式下，当浏览器支持 `SpeechRecognition` 时，`useVoiceDictation` 使用 `startBrowser()`（Web Speech API，无需密钥，增量流式传输）。它仅在 `SpeechRecognition` 不可用时（例如 Firefox）回退到 MediaRecorder → 服务器上传路径。这意味着听写在 Chrome、Edge 和 Safari 中无需任何 API 密钥配置即可开箱即用。
- 专用 macOS Tauri 原生表面可以保存 `mac-native`，但不要假设共享 React 设置默认为它。
- 旧存储的 `builder` 值被视为 `builder-gemini`。
- 旧存储的 `browser` 值被视为 `mac-native`。
- 保存的 `google-realtime` 偏好绝不能访问 `/_agent-native/transcribe-voice`。它们通过专用会话桥接 `POST /_agent-native/transcribe-stream/session`，该桥接铸造一个不透明的 ai-services websocket 会话，并将 Google 服务账户 JSON 保留在客户端之外。
- 在当前桥接中，Google 选项仅当用户的 `GOOGLE_APPLICATION_CREDENTIALS` 密钥存在且配置了托管 AI 服务连接时才真正就绪，因为框架在流式传输开始前铸造托管 ai-services 会话。

## 各部分所在位置

| 文件                                                                  | 用途                                             |
| --------------------------------------------------------------------- | ------------------------------------------------ |
| `packages/core/src/client/composer/useVoiceDictation.ts`              | Provider 路由 hook（MediaRecorder / Web Speech） |
| `packages/core/src/client/composer/VoiceButton.tsx`                   | 麦克风按钮 + 实时振幅 + 取消覆盖层              |
| `packages/core/src/client/composer/TiptapComposer.tsx`                | 连接 hook、插入和键盘快捷键                      |
| `packages/core/src/client/settings/VoiceTranscriptionSection.tsx`     | 侧边栏设置中的实时来源 + 清理控件               |
| `packages/core/src/client/transcription/BuilderTranscriptionCta.tsx`  | Builder 账户未连接时显示的 CTA                   |
| `packages/core/src/client/transcription/use-live-transcription.ts`    | 录音的 Web Speech 实时转录 hook                  |
| `packages/core/src/server/transcribe-voice.ts`                        | 路由处理程序（路由到 Builder/Gemini/Groq/Whisper）|
| `packages/core/src/transcription/builder-transcription.ts`            | Builder 代理转录客户端                           |
| `packages/core/src/secrets/register-framework-secrets.ts`             | 框架级 provider 密钥注册                         |

## 密钥解析（服务器）

`transcribe-voice.ts` 仅用于批处理。不要向此路由添加实时流式传输。Google Speech-to-Text 实时使用专用音频帧协议：客户端音频帧 → `/_agent-native/transcribe-stream/session` → ai-services WebSocket → Google gRPC `StreamingRecognize` → 部分/最终转录事件。使用规范文档 URL：
https://cloud.google.com/speech-to-text/v2/docs/streaming-recognize

批处理路由基于用户的 provider 偏好：

1. 如果 `builder-gemini` 且 `resolveHasBuilderPrivateKey()` → 通过 Builder 代理调用 `transcribeWithBuilder({ model: "gemini-3-1-flash-lite" })`，或当桌面客户端发送文本而非音频时使用 Builder Gemini Flash-Lite 清理实时原生/浏览器转录。
2. 如果 `builder` 且 `resolveHasBuilderPrivateKey()` → 遗留别名；优先使用 `builder-gemini`。
3. 如果 `gemini` → 解析 `GEMINI_API_KEY` 并调用直接 Google Gemini 路径。
4. 如果 `groq` → 解析 `GROQ_API_KEY` 并调用 Groq 的 Whisper 兼容端点。
5. 如果 `openai` → 解析 `OPENAI_API_KEY`：
   - `readAppSecret({ key: "OPENAI_API_KEY", scope: "user", scopeId: session.email })` — 用户的加密密钥。
   - `resolveCredential("OPENAI_API_KEY")` — 环境变量 + SQL 设置回退。

在 auto 模式 / 无偏好时，路由在 Builder 连接时先尝试 Builder Gemini Flash-Lite，然后是 Gemini BYOK、Groq 和 OpenAI。
当请求包含 `instructions` 时，将它们传递给选定的 LLM provider。Gemini 在转录提示中使用它们，Builder 接收它们作为转录/清理指令，Whisper 兼容的 provider 接收它们作为 provider 提示/上下文。

切勿硬编码共享密钥。切勿记录值。切勿将其回传给客户端。

## 按模板覆盖

模板可以：
- **禁用麦克风**：向 `TiptapComposer` 传递 `voiceEnabled={false}`。
- **替换按钮**：包装 `TiptapComposer` 并渲染你自己的 `extraActionButton`（框架麦克风位于 `extraActionButton` 和发送按钮之间）。
- **将 provider 密钥预注册为 `required: true`**：当模板在入门中需要特定 BYOK provider 时，从你自己的服务器插件调用 `registerRequiredSecret(...)`。

## 禁止事项

- 不要从客户端调用转录 provider — 通过 `/_agent-native/transcribe-voice` 以便用户的密钥保留在服务端。
- 不要移除取消功能 — 麦克风权限滥用担忧是真实的。
- 不要自动提交转录文本 — 用户总是在发送前编辑。
- 不要复制 Cursor 的"为空时隐藏发送"模式 — 它让用户困惑。