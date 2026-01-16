#!/bin/bash

# WebSocket 修复脚本
# 用于快速修复生产环境的 WebSocket 连接问题

set -e  # 遇到错误立即退出

echo "🔧 WebSocket 连接问题修复脚本"
echo "================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 1. 更新后端环境变量
echo "📋 步骤 1: 更新后端环境变量"
echo "----------------------------------------"

if [ -f "nest/.env" ]; then
    # 备份原文件
    cp nest/.env nest/.env.backup
    echo -e "${GREEN}✅ 已备份 nest/.env 到 nest/.env.backup${NC}"
    
    # 更新 NODE_ENV
    if grep -q "^NODE_ENV=" nest/.env; then
        sed -i.tmp 's/^NODE_ENV=.*/NODE_ENV=production/' nest/.env
        echo -e "${GREEN}✅ 已设置 NODE_ENV=production${NC}"
    else
        echo "NODE_ENV=production" >> nest/.env
        echo -e "${GREEN}✅ 已添加 NODE_ENV=production${NC}"
    fi
    
    # 更新 FRONTEND_URL
    if grep -q "^FRONTEND_URL=" nest/.env; then
        sed -i.tmp 's|^FRONTEND_URL=.*|FRONTEND_URL=http://47.94.128.228|' nest/.env
        echo -e "${GREEN}✅ 已设置 FRONTEND_URL=http://47.94.128.228${NC}"
    else
        echo "FRONTEND_URL=http://47.94.128.228" >> nest/.env
        echo -e "${GREEN}✅ 已添加 FRONTEND_URL=http://47.94.128.228${NC}"
    fi
    
    # 清理临时文件
    rm -f nest/.env.tmp
else
    echo -e "${RED}❌ 未找到 nest/.env 文件${NC}"
    exit 1
fi

# 2. 更新前端环境变量
echo ""
echo "📋 步骤 2: 更新前端环境变量"
echo "----------------------------------------"

if [ -f "nest-react/.env.production" ]; then
    # 备份原文件
    cp nest-react/.env.production nest-react/.env.production.backup
    echo -e "${GREEN}✅ 已备份 nest-react/.env.production${NC}"
    
    # 更新 VITE_WS_URL
    if grep -q "^VITE_WS_URL=" nest-react/.env.production; then
        sed -i.tmp 's|^VITE_WS_URL=.*|VITE_WS_URL=http://47.94.128.228|' nest-react/.env.production
        echo -e "${GREEN}✅ 已设置 VITE_WS_URL=http://47.94.128.228${NC}"
    else
        echo "VITE_WS_URL=http://47.94.128.228" >> nest-react/.env.production
        echo -e "${GREEN}✅ 已添加 VITE_WS_URL=http://47.94.128.228${NC}"
    fi
    
    # 清理临时文件
    rm -f nest-react/.env.production.tmp
else
    echo -e "${RED}❌ 未找到 nest-react/.env.production 文件${NC}"
    exit 1
fi

# 3. 重新构建前端
echo ""
echo "📋 步骤 3: 重新构建前端"
echo "----------------------------------------"

cd nest-react
if command -v pnpm &> /dev/null; then
    echo "使用 pnpm 构建..."
    pnpm build
elif command -v npm &> /dev/null; then
    echo "使用 npm 构建..."
    npm run build
else
    echo -e "${RED}❌ 未找到 pnpm 或 npm${NC}"
    exit 1
fi
cd ..

echo -e "${GREEN}✅ 前端构建完成${NC}"

# 4. 检查 PM2 进程
echo ""
echo "📋 步骤 4: 检查并重启后端服务"
echo "----------------------------------------"

if command -v pm2 &> /dev/null; then
    # 检查进程是否存在
    if pm2 list | grep -q "nest-backend"; then
        echo "重启 nest-backend 进程..."
        pm2 restart nest-backend
        echo -e "${GREEN}✅ 后端服务已重启${NC}"
    else
        echo -e "${YELLOW}⚠️  未找到 nest-backend 进程${NC}"
        echo "请手动启动: cd nest && pm2 start dist/main.js --name nest-backend"
    fi
else
    echo -e "${YELLOW}⚠️  未安装 PM2，请手动重启后端服务${NC}"
fi

# 5. 显示 Nginx 配置提示
echo ""
echo "📋 步骤 5: Nginx 配置检查"
echo "----------------------------------------"
echo ""
echo -e "${YELLOW}⚠️  请确保 Nginx 配置正确！${NC}"
echo ""
echo "参考配置文件: nginx-websocket.conf"
echo ""
echo "关键配置点:"
echo "1. 在 http 块中添加 WebSocket 升级映射:"
echo "   map \$http_upgrade \$connection_upgrade {"
echo "       default upgrade;"
echo "       '' close;"
echo "   }"
echo ""
echo "2. 在 server 块中添加 Socket.IO 代理:"
echo "   location /socket.io/ {"
echo "       proxy_pass http://localhost:7002/socket.io/;"
echo "       proxy_http_version 1.1;"
echo "       proxy_set_header Upgrade \$http_upgrade;"
echo "       proxy_set_header Connection \$connection_upgrade;"
echo "       # ... 其他配置"
echo "   }"
echo ""
echo "更新 Nginx 配置后，执行:"
echo "   sudo nginx -t          # 测试配置"
echo "   sudo nginx -s reload   # 重载配置"
echo ""

# 6. 完成
echo ""
echo "================================"
echo -e "${GREEN}✅ 修复脚本执行完成！${NC}"
echo "================================"
echo ""
echo "后续步骤:"
echo "1. 更新服务器上的 Nginx 配置（参考 nginx-websocket.conf）"
echo "2. 测试 Nginx 配置: sudo nginx -t"
echo "3. 重载 Nginx: sudo nginx -s reload"
echo "4. 查看后端日志: pm2 logs nest-backend"
echo "5. 在浏览器中测试 WebSocket 连接"
echo ""
echo "调试工具:"
echo "- 查看 Token: node nest/debug-token.js <your-token>"
echo "- 查看环境: node nest/check-env.js"
echo "- 前端调试页面: http://47.94.128.228/debug"
echo ""
