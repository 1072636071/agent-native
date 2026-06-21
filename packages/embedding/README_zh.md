# @agent-native/embedding

在 React 或纯浏览器应用中嵌入 Agent-Native 应用、选择器和代理。

```tsx
import { EmbeddedApp } from "@agent-native/embedding";

<EmbeddedApp
  url="https://assets.agent-native.com/picker"
  onLoad={(ref) => {
    ref.postMessage("configure", { accept: ["image/*"] });
  }}
  onMessage={(name, payload) => {
    if (name === "chooseImage") {
      console.log(payload);
    }
  }}
/>;
```

在嵌入的应用内部：

```ts
import { sendEmbeddedAppMessage } from "@agent-native/embedding/bridge";

sendEmbeddedAppMessage("chooseImage", {
  url: "https://cdn.example.com/image.png",
});
```

代理辅助函数：

```ts
import { getA2AUrl, getMcpUrl, sendMessage } from "@agent-native/embedding";

console.log(getMcpUrl("https://assets.agent-native.com"));
console.log(getA2AUrl("https://assets.agent-native.com"));

for await (const chunk of sendMessage(
  "https://assets.agent-native.com",
  "Generate a blog hero",
)) {
  process.stdout.write(chunk);
}
```