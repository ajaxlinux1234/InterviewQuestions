/**
 * 环境配置检查脚本
 * 检查服务器环境配置是否正确
 */

require("dotenv").config();

console.log("\n========================================");
console.log("环境配置检查");
console.log("========================================\n");

console.log("数据库配置:");
console.log(`  MYSQL_HOST: ${process.env.MYSQL_HOST || "未设置"}`);
console.log(`  MYSQL_PORT: ${process.env.MYSQL_PORT || "未设置"}`);
console.log(`  MYSQL_USER: ${process.env.MYSQL_USER || "未设置"}`);
console.log(
  `  MYSQL_PASSWORD: ${process.env.MYSQL_PASSWORD ? "已设置" : "未设置"}`
);
console.log(`  MYSQL_DATABASE: ${process.env.MYSQL_DATABASE || "未设置"}`);

console.log("\n前端配置:");
console.log(
  `  FRONTEND_URL: ${process.env.FRONTEND_URL || "❌ 未设置 (重要!)"}`
);
console.log(`  NODE_ENV: ${process.env.NODE_ENV || "❌ 未设置 (重要!)"}`);

console.log("\nAI 配置:");
console.log(
  `  GROQ_API_KEY: ${process.env.GROQ_API_KEY ? "已设置" : "未设置"}`
);
console.log(`  GROQ_BASE_URL: ${process.env.GROQ_BASE_URL || "未设置"}`);
console.log(`  GROQ_MODEL: ${process.env.GROQ_MODEL || "未设置"}`);

console.log("\n========================================");
console.log("配置检查结果");
console.log("========================================\n");

const issues = [];

if (!process.env.FRONTEND_URL) {
  issues.push("❌ FRONTEND_URL 未设置 - WebSocket CORS 将使用默认值");
}

if (!process.env.NODE_ENV || process.env.NODE_ENV !== "production") {
  issues.push("❌ NODE_ENV 未设置为 production - 可能使用开发环境配置");
}

if (!process.env.MYSQL_DATABASE) {
  issues.push("⚠️  MYSQL_DATABASE 未设置 - 将使用默认值 im_service");
}

if (issues.length > 0) {
  console.log("发现以下问题:\n");
  issues.forEach((issue) => console.log(`  ${issue}`));
  console.log("\n建议修复:");
  console.log("  1. 编辑 .env 文件: nano .env");
  console.log("  2. 添加以下配置:");
  console.log("     FRONTEND_URL=http://47.94.128.228");
  console.log("     NODE_ENV=production");
  console.log("  3. 重启应用: pm2 restart nest-backend");
} else {
  console.log("✓ 所有配置正确");
}

console.log("\n========================================\n");
