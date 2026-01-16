#!/bin/bash

# ========================================
# 数据库架构迁移脚本
# 用于在服务器上执行数据库架构更新
# ========================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}数据库架构迁移工具${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 读取数据库配置
if [ -f "../.env" ]; then
    echo -e "${GREEN}正在读取 .env 配置文件...${NC}"
    export $(cat ../.env | grep -v '^#' | xargs)
else
    echo -e "${RED}错误: 找不到 .env 文件${NC}"
    exit 1
fi

# 显示数据库信息
echo -e "${YELLOW}数据库主机:${NC} ${MYSQL_HOST}"
echo -e "${YELLOW}数据库端口:${NC} ${MYSQL_PORT}"
echo -e "${YELLOW}数据库名称:${NC} ${MYSQL_DATABASE}"
echo -e "${YELLOW}数据库用户:${NC} ${MYSQL_USER}"
echo ""

# 确认执行
read -p "确认要执行数据库迁移吗? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}已取消迁移${NC}"
    exit 0
fi

# 执行迁移
echo -e "${GREEN}正在执行数据库迁移...${NC}"
mysql -h"${MYSQL_HOST}" -P"${MYSQL_PORT}" -u"${MYSQL_USER}" -p"${MYSQL_PASSWORD}" < migrate-schema.sql

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ 数据库迁移成功完成!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${YELLOW}请重启 NestJS 应用:${NC}"
    echo -e "  pm2 restart nest-backend"
    echo ""
else
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}✗ 数据库迁移失败${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    exit 1
fi
