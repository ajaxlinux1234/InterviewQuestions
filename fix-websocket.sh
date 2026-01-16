#!/bin/bash

# WebSocket 认证问题一键修复脚本
# 用于阿里云服务器

echo "========================================"
echo "WebSocket 认证问题诊断和修复"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 检查环境配置
echo -e "${YELLOW}步骤 1: 检查环境配置${NC}"
cd /root/apps/InterviewQuestions/nest
node check-env.js

echo ""
read -p "是否需要修复环境配置? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}正在修复环境配置...${NC}"
    
    # 检查 .env 文件是否存在
    if [ ! -f ".env" ]; then
        echo -e "${RED}错误: .env 文件不存在${NC}"
        exit 1
    fi
    
    # 备份原文件
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "已备份 .env 文件"
    
    # 检查并添加 FRONTEND_URL
    if ! grep -q "^FRONTEND_URL=" .env; then
        echo "FRONTEND_URL=http://47.94.128.228" >> .env
        echo "✓ 已添加 FRONTEND_URL"
    else
        sed -i 's|^FRONTEND_URL=.*|FRONTEND_URL=http://47.94.128.228|' .env
        echo "✓ 已更新 FRONTEND_URL"
    fi
    
    # 检查并添加 NODE_ENV
    if ! grep -q "^NODE_ENV=" .env; then
        echo "NODE_ENV=production" >> .env
        echo "✓ 已添加 NODE_ENV"
    else
        sed -i 's|^NODE_ENV=.*|NODE_ENV=production|' .env
        echo "✓ 已更新 NODE_ENV"
    fi
    
    echo -e "${GREEN}环境配置已修复${NC}"
fi

# 2. 检查代码是否最新
echo ""
echo -e "${YELLOW}步骤 2: 检查代码版本${NC}"
git log -1 --oneline

echo ""
read -p "是否需要拉取最新代码? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}正在拉取最新代码...${NC}"
    git pull
    
    # 安装依赖
    echo "检查依赖..."
    pnpm install
    
    # 重新构建
    echo "重新构建..."
    pnpm build
fi

# 3. 检查数据库架构
echo ""
echo -e "${YELLOW}步骤 3: 检查数据库架构${NC}"
echo "检查 users 表是否有 last_seen 列..."

HAS_LAST_SEEN=$(mysql -u root -p'zhongguo1234..A' im_system -e "SHOW COLUMNS FROM users LIKE 'last_seen';" 2>/dev/null | wc -l)

if [ "$HAS_LAST_SEEN" -lt 2 ]; then
    echo -e "${RED}✗ users 表缺少 last_seen 列${NC}"
    read -p "是否执行数据库迁移? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "执行数据库迁移..."
        mysql -u root -p'zhongguo1234..A' im_system < database/migrate-schema.sql
        echo -e "${GREEN}✓ 数据库迁移完成${NC}"
    fi
else
    echo -e "${GREEN}✓ 数据库架构正确${NC}"
fi

# 4. 重启应用
echo ""
echo -e "${YELLOW}步骤 4: 重启应用${NC}"
read -p "是否重启 NestJS 应用? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "重启应用..."
    pm2 restart nest-backend
    echo -e "${GREEN}✓ 应用已重启${NC}"
    
    echo ""
    echo "等待 3 秒..."
    sleep 3
    
    echo ""
    echo -e "${YELLOW}查看应用日志:${NC}"
    pm2 logs nest-backend --lines 20 --nostream
fi

# 5. 测试建议
echo ""
echo "========================================"
echo -e "${GREEN}修复完成！${NC}"
echo "========================================"
echo ""
echo "接下来请:"
echo "  1. 在浏览器中清除缓存并重新登录"
echo "  2. 打开开发者工具 -> Network -> WS"
echo "  3. 查看 WebSocket 连接是否成功"
echo "  4. 如果仍有问题，查看日志:"
echo "     pm2 logs nest-backend"
echo ""
echo "========================================"
