#!/bin/bash

# 等待数据库可用
echo "正在等待数据库..."
python -c "
import time
import psycopg2
import os

host = os.environ.get('DB_HOST', 'localhost')
port = os.environ.get('DB_PORT', '5432')
user = os.environ.get('DB_USER', 'postgres')
password = os.environ.get('DB_PASSWORD', 'password')
dbname = os.environ.get('DB_NAME', 'weknowledge')

while True:
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            dbname=dbname
        )
        conn.close()
        break
    except psycopg2.OperationalError:
        print('数据库未就绪，等待...')
        time.sleep(1)
"

echo "数据库已就绪!"

# 创建初始迁移
if [ ! -d "/app/alembic/versions" ] || [ -z "$(ls -A /app/alembic/versions)" ]; then
    echo "创建初始迁移..."
    alembic revision --autogenerate -m "initial"
fi

# 应用迁移
echo "应用数据库迁移..."
alembic upgrade head

# 初始化数据库
echo "初始化数据库..."
python -m app.db.init_db

# 启动应用
echo "启动API服务..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload 