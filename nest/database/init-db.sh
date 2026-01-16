#!/bin/bash

# 数据库初始化脚本
# 使用方法: ./init-db.sh

echo "开始初始化数据库..."

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SQL_FILE="$SCRIPT_DIR/init-database.sql"

# 检查 SQL 文件是否存在
if [ ! -f "$SQL_FILE" ]; then
    echo "错误: 找不到 SQL 文件: $SQL_FILE"
    exit 1
fi

# 执行 SQL 脚本
echo "执行 SQL 脚本: $SQL_FILE"
mysql -u root < "$SQL_FILE"

# 检查执行结果
if [ $? -eq 0 ]; then
    echo "✅ 数据库初始化成功！"
    echo ""
    echo "数据库信息:"
    echo "  数据库名: im_system"
    echo "  测试用户: user1@example.com / password123"
    echo "           user2@example.com / password123"
else
    echo "❌ 数据库初始化失败，请检查错误信息"
    exit 1
fi
