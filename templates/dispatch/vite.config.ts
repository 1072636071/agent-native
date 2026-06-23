import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "@agent-native/core/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [reactRouter()],
  // shiki only runs in AssistantChat's useEffect — keep it out of the
  // CF Pages Functions bundle (25 MiB limit).
  ssrStubs: ["shiki"],
  fsAllow: [path.resolve(__dirname, "../../packages/dispatch")],
});
