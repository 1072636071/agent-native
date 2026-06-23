---
"@agent-native/core": patch
---

Bump nitro to 3.0.260603-beta and align workspace Vite catalog to 8.0.16

The previous pairing (nitro 3.0.260415-beta + vite 8.0.3) left the dev-mode
Nitro Vite environment unavailable on startup, causing `/_agent-native/*`
framework routes to 503 until the environment eventually (and unreliably)
initialized. Aligning with the verified-compatible pair restores reliable
dev-server startup.
