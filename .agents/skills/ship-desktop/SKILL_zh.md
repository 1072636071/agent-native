---
name: ship-desktop
description: 在本地构建 Agent Native 桌面应用，杀死运行中的副本，安装新的 DMG 到 /Applications，并启动它。当用户说"重建/重新安装桌面应用"、"ship desktop"、"安装桌面应用"或类似内容时使用。
user-invocable: true
metadata:
  internal: true
---

# Ship Desktop

Agent Native Electron 应用的端到端本地安装。生成一个**未签名、未公证的 arm64 DMG** — 适用于 Steve 的 M 系列 Mac 上的本地使用。此技能有意绕过代码签名/公证，因为它们仅在 CI（`.github/workflows/desktop-release.yml`）中工作，那里有 Apple 密钥。

## 何时使用

- "重建并安装桌面应用"
- "在本地交付桌面应用"
- 在修改 `packages/desktop-app/` 下的任何内容后
- 在升级影响 shell（main/preload/renderer）的依赖后

## 预检

```bash
ls packages/desktop-app/package.json      # 确认：我们在框架根目录
pgrep -f "/Applications/Agent Native.app" # 注意它当前是否在运行
```

## 步骤

### 1. 构建 arm64 DMG（未签名）

通用构建在本地合并步骤中会静默卡住（npm dep collector 噪音）。仅构建 arm64 — 这正是 Steve 的机器运行的。

```bash
cd packages/desktop-app
pnpm exec electron-vite build
CSC_IDENTITY_AUTO_DISCOVERY=false pnpm exec electron-builder --mac dmg --arm64 \
  -c.mac.notarize=false \
  -c.mac.identity=null \
  -c.mac.target.target=dmg \
  -c.mac.target.arch=arm64 \
  > /tmp/desktop-build.log 2>&1
```

构建运行约 1–2 分钟。在末尾附近注意 `building target=DMG arch=arm64 file=dist/Agent Native.dmg`。跳过 `npm error missing/invalid` 噪音 — 它来自 pnpm 工作区内的 `npm ls` dep collector，是无害的。

如果完成但未写入 `dist/Agent Native.dmg`，在日志中搜索 `Error|Failed|exited.*code=[^0]` — 真正的失败会显示在那里。

### 2. 退出运行中的副本

```bash
osascript -e 'tell application "Agent Native" to quit' || true
sleep 2
pgrep -f "/Applications/Agent Native.app/Contents/MacOS/Agent Native" | xargs -r kill
```

### 3. 为 macOS Tahoe Liquid Glass 修补构建的 .app

electron-builder 仅发布 `icon.icns`。macOS 26（Tahoe）仅在应用同时拥有 `Assets.car`（从我们的 `.icon` 包编译）和 `Info.plist` 中设置的 `CFBundleIconName` 时才绘制动态 Liquid Glass 边框/高光。`scripts/build-branding-assets.mjs` 从 `packages/core/src/assets/branding/agent-native.icon` 生成 `packages/desktop-app/build/Assets.car`。在复制到 `/Applications` 之前直接将其安装到解包的 `.app` 中（跳过 DMG — 它只是压缩包装）。

```bash
APP="packages/desktop-app/dist/mac-arm64/Agent Native.app"
cp packages/desktop-app/build/Assets.car "$APP/Contents/Resources/Assets.car"
/usr/libexec/PlistBuddy -c "Add :CFBundleIconName string agent-native" "$APP/Contents/Info.plist" 2>/dev/null \
  || /usr/libexec/PlistBuddy -c "Set :CFBundleIconName agent-native" "$APP/Contents/Info.plist"
```

### 4. 安装到 /Applications

```bash
rm -rf "/Applications/Agent Native.app"
cp -R "packages/desktop-app/dist/mac-arm64/Agent Native.app" /Applications/
```

### 5. 刷新图标缓存 + 启动

macOS 激进地缓存 Dock/Finder 图标。不刷新的话，新的 `.icns` 直到注销才会显示。`mv … .tmp && mv … back` 是无需 `killall Dock` 的缓存清除器（agent 沙箱通常拒绝 `killall Dock`）。

```bash
xattr -dr com.apple.quarantine "/Applications/Agent Native.app" 2>/dev/null
/System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister -f "/Applications/Agent Native.app"
find ~/Library/Caches/com.apple.iconservices.store -type f -delete 2>/dev/null
rm -f /private/var/folders/*/C/com.apple.dock.iconcache 2>/dev/null
mv "/Applications/Agent Native.app" "/Applications/Agent Native.app.tmp" && mv "/Applications/Agent Native.app.tmp" "/Applications/Agent Native.app"
open "/Applications/Agent Native.app"
```

## 备注

- **为什么不用 `pnpm run build:mac`？** 那个脚本运行通用 + 公证 + 签名，在缺少 `APPLE_ID` / `APPLE_APP_SPECIFIC_PASSWORD` 环境变量时会挂起（仅在 GitHub Actions 中设置）。通用合并步骤在本地也会静默中止。
- **正式交付** — 使用 `Desktop App Release` GitHub Actions 工作流（`.github/workflows/desktop-release.yml`）。切勿发布本地构建的产物。
- **数据保留** — 用户设置存储在 `~/Library/Application Support/Agent Native/`。重新安装不会触及它们。
- **如果安装后应用无法打开**，在 Console.app 中检查 `Agent Native` 条目 — 常见原因是旧版本仍在运行的陈旧 Electron helper。