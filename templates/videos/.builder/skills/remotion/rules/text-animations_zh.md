---
name: text-animations
description: Remotion 的排版和文本动画模式。
metadata:
  tags: typography, text, typewriter, highlighter
---

## 文本动画

基于 `useCurrentFrame()`，逐字符缩减字符串以创建打字机效果。

## 打字机效果

始终使用字符串切片实现打字机效果。不要使用逐字符透明度。

## 词语高亮

通过对 width/background 属性使用插值来动画化词语背后的高亮。