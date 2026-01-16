import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],

    // 路径别名
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    // 开发服务器配置
    server: {
      port: 3000,
      host: true, // 允许局域网访问
      open: true, // 自动打开浏览器
      proxy: {
        // 如果需要代理 API 请求
        // '/api': {
        //   target: env.VITE_API_BASE_URL || 'http://localhost:7002',
        //   changeOrigin: true,
        // },
      },
    },

    // 构建配置
    build: {
      outDir: "build", // 输出目录（保持与 CRA 一致）
      sourcemap: mode === "development", // 开发环境生成 sourcemap
      rollupOptions: {
        output: {
          // 分包策略
          manualChunks: {
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            "ui-vendor": ["lucide-react", "react-hot-toast"],
            "markdown-vendor": [
              "react-markdown",
              "remark-gfm",
              "rehype-highlight",
              "rehype-raw",
            ],
          },
        },
      },
      // 压缩配置
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: mode === "production", // 生产环境移除 console
          drop_debugger: true,
        },
      },
    },

    // 环境变量前缀（Vite 默认是 VITE_）
    envPrefix: "VITE_",
  };
});
