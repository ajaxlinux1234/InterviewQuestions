/**
 * Token 调试脚本
 * 用于检查数据库中的 token 状态
 *
 * 使用方法:
 * node debug-token.js <your_token_here>
 */

require("dotenv").config();
const mysql = require("mysql2/promise");

async function debugToken(token) {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "localhost",
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || "im_system",
  });

  console.log("\n========================================");
  console.log("Token 调试信息");
  console.log("========================================\n");

  try {
    // 查询 token 信息
    const [tokens] = await connection.execute(
      `SELECT 
        t.id,
        t.token,
        t.user_id,
        t.is_revoked,
        t.expires_at,
        t.created_at,
        t.last_used_at,
        u.username,
        u.email
      FROM user_tokens t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.token = ?`,
      [token]
    );

    if (tokens.length === 0) {
      console.log("❌ Token 不存在于数据库中");
      console.log(`   Token: ${token.substring(0, 50)}...`);

      // 查询最近的 tokens
      console.log("\n最近创建的 5 个 tokens:");
      const [recentTokens] = await connection.execute(
        `SELECT 
          LEFT(token, 30) as token_preview,
          user_id,
          is_revoked,
          expires_at,
          created_at
        FROM user_tokens
        ORDER BY created_at DESC
        LIMIT 5`
      );

      if (recentTokens.length > 0) {
        console.table(recentTokens);
      } else {
        console.log("  数据库中没有任何 token");
      }
    } else {
      const tokenInfo = tokens[0];
      const now = new Date();
      const expiresAt = new Date(tokenInfo.expires_at);
      const isExpired = now > expiresAt;
      const isRevoked = tokenInfo.is_revoked !== 0;

      console.log("✓ Token 找到");
      console.log(`  Token ID: ${tokenInfo.id}`);
      console.log(`  用户 ID: ${tokenInfo.user_id}`);
      console.log(`  用户名: ${tokenInfo.username}`);
      console.log(`  邮箱: ${tokenInfo.email}`);
      console.log(
        `  是否撤销: ${tokenInfo.is_revoked} (${
          isRevoked ? "已撤销" : "未撤销"
        })`
      );
      console.log(`  过期时间: ${tokenInfo.expires_at}`);
      console.log(
        `  当前时间: ${now.toISOString().slice(0, 19).replace("T", " ")}`
      );
      console.log(`  状态: ${isExpired ? "已过期" : "有效"}`);
      console.log(`  创建时间: ${tokenInfo.created_at}`);
      console.log(`  最后使用: ${tokenInfo.last_used_at || "从未使用"}`);

      console.log("\n========================================");
      if (isRevoked) {
        console.log("❌ Token 已被撤销");
        console.log("   解决方案: 重新登录获取新 token");
      } else if (isExpired) {
        console.log("❌ Token 已过期");
        console.log("   解决方案: 重新登录获取新 token");
      } else {
        console.log("✓ Token 有效，可以使用");
        console.log("   如果仍然无法连接，请检查:");
        console.log("   1. 前端是否正确传递了 token");
        console.log("   2. 后端日志中的详细错误信息");
        console.log("   3. CORS 配置是否正确");
      }
    }

    // 检查数据库字段类型
    console.log("\n========================================");
    console.log("数据库字段类型检查");
    console.log("========================================\n");

    const [fields] = await connection.execute(`DESCRIBE user_tokens`);

    const isRevokedField = fields.find((f) => f.Field === "is_revoked");
    if (isRevokedField) {
      console.log("is_revoked 字段信息:");
      console.log(`  类型: ${isRevokedField.Type}`);
      console.log(`  允许 NULL: ${isRevokedField.Null}`);
      console.log(`  默认值: ${isRevokedField.Default}`);
    }
  } catch (error) {
    console.error("❌ 查询失败:", error.message);
  } finally {
    await connection.end();
  }

  console.log("\n========================================\n");
}

// 从命令行参数获取 token
const token = process.argv[2];

if (!token) {
  console.log("使用方法: node debug-token.js <your_token_here>");
  console.log("\n示例:");
  console.log("  node debug-token.js eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...");
  process.exit(1);
}

debugToken(token).catch(console.error);
