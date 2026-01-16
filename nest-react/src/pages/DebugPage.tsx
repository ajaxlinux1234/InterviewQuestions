import { useState, useEffect } from "react";
import { useAuthStore } from "../stores/authStore";

export default function DebugPage() {
  const { token, user } = useAuthStore();
  const [localStorageToken, setLocalStorageToken] = useState<string | null>(
    null
  );
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    // 检查 localStorage 中的 token
    const storedToken = localStorage.getItem("token");
    setLocalStorageToken(storedToken);
  }, []);

  const testSocketConnection = () => {
    if (!token) {
      alert("没有 token，请先登录");
      return;
    }

    console.log("测试 Socket 连接...");
    console.log("Token:", token);

    // 动态导入 socket.io-client
    import("socket.io-client").then(({ io }) => {
      const socket = io(
        `${import.meta.env.VITE_WS_URL || "http://localhost:7002"}/im`,
        {
          auth: {
            token: token,
          },
          transports: ["websocket", "polling"],
        }
      );

      socket.on("connected", (data) => {
        console.log("✓ Socket 连接成功:", data);
        setSocketConnected(true);
        alert(`连接成功！用户ID: ${data.userId}`);
      });

      socket.on("error", (error) => {
        console.error("✗ Socket 错误:", error);
        alert(`连接失败: ${error.message}`);
      });

      socket.on("connect_error", (error) => {
        console.error("✗ 连接错误:", error);
        alert(`连接错误: ${error.message}`);
      });

      // 5秒后断开
      setTimeout(() => {
        socket.disconnect();
        console.log("测试完成，已断开连接");
      }, 5000);
    });
  };

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>🔍 调试信息</h1>

      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          background: "#f5f5f5",
          borderRadius: "5px",
        }}
      >
        <h2>认证状态</h2>
        <p>
          <strong>用户:</strong> {user ? user.username : "未登录"}
        </p>
        <p>
          <strong>用户ID:</strong> {user ? user.id : "N/A"}
        </p>
        <p>
          <strong>邮箱:</strong> {user ? user.email : "N/A"}
        </p>
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          background: "#f5f5f5",
          borderRadius: "5px",
        }}
      >
        <h2>Token 信息</h2>
        <p>
          <strong>Zustand Store Token:</strong>
        </p>
        <textarea
          readOnly
          value={token || "无"}
          style={{
            width: "100%",
            height: "80px",
            fontFamily: "monospace",
            fontSize: "12px",
          }}
        />

        <p style={{ marginTop: "15px" }}>
          <strong>LocalStorage Token:</strong>
        </p>
        <textarea
          readOnly
          value={localStorageToken || "无"}
          style={{
            width: "100%",
            height: "80px",
            fontFamily: "monospace",
            fontSize: "12px",
          }}
        />

        <p style={{ marginTop: "15px" }}>
          <strong>Token 长度:</strong> {token?.length || 0} 字符
        </p>
        <p>
          <strong>Token 前30字符:</strong> {token?.substring(0, 30) || "N/A"}
        </p>
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          background: "#f5f5f5",
          borderRadius: "5px",
        }}
      >
        <h2>环境变量</h2>
        <p>
          <strong>API Base URL:</strong>{" "}
          {import.meta.env.VITE_API_BASE_URL || "未设置"}
        </p>
        <p>
          <strong>WS URL:</strong> {import.meta.env.VITE_WS_URL || "未设置"}
        </p>
        <p>
          <strong>Mode:</strong> {import.meta.env.MODE}
        </p>
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          background: "#f5f5f5",
          borderRadius: "5px",
        }}
      >
        <h2>Socket 测试</h2>
        <p>
          <strong>连接状态:</strong> {socketConnected ? "✓ 已连接" : "✗ 未连接"}
        </p>
        <button
          onClick={testSocketConnection}
          style={{
            padding: "10px 20px",
            background: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          测试 Socket 连接
        </button>
        <p style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
          点击按钮测试 Socket 连接，查看浏览器控制台获取详细日志
        </p>
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          background: "#fff3cd",
          borderRadius: "5px",
        }}
      >
        <h2>⚠️ 调试步骤</h2>
        <ol>
          <li>确认上面显示了有效的 Token</li>
          <li>点击"测试 Socket 连接"按钮</li>
          <li>打开浏览器开发者工具的 Console 标签</li>
          <li>查看连接日志和错误信息</li>
          <li>
            如果失败，复制 Token 到服务器运行:{" "}
            <code>node debug-token.js &lt;token&gt;</code>
          </li>
        </ol>
      </div>
    </div>
  );
}
