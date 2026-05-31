#!/bin/bash

# ============================================
# AXIS O 一键部署脚本
# ============================================
# 用途：在服务器上一键部署 AXIS O 全栈应用
# 支持：Ubuntu 20.04+ / Debian 11+
# 使用：bash deploy.sh
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量（部署前请修改）
DOMAIN="your-domain.com"
EMAIL="your-email@example.com"
DEPLOY_PATH="/var/www/axis-o"
SERVER_USER="www-data"
NODE_PORT="3001"

# 前端构建产物本地路径（相对于脚本目录）
LOCAL_CLIENT_DIST="./client/dist"
LOCAL_SERVER_DIST="./server/dist"

# ============================================
# 打印函数
# ============================================
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_step() {
    echo -e "${YELLOW}[步骤]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓ 成功${NC} $1"
}

print_error() {
    echo -e "${RED}✗ 错误${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠ 警告${NC} $1"
}

# ============================================
# 前置检查
# ============================================
preflight_check() {
    print_header "前置检查"

    # 检查是否为 root 用户
    if [[ $EUID -ne 0 ]]; then
        print_error "请使用 root 用户运行此脚本"
        echo "提示：运行 'sudo su -' 切换到 root 用户"
        exit 1
    fi

    # 检查操作系统
    if [[ ! -f /etc/os-release ]]; then
        print_error "无法检测操作系统"
        exit 1
    fi

    . /etc/os-release
    print_step "检测到操作系统: $PRETTY_NAME"

    if [[ "$ID" != "ubuntu" && "$ID" != "debian" ]]; then
        print_warning "此脚本主要针对 Ubuntu/Debian 设计，其他系统可能需要调整"
    fi

    # 检查本地构建产物
    print_step "检查本地构建产物..."

    if [[ ! -d "$LOCAL_CLIENT_DIST" ]]; then
        print_error "前端构建产物未找到: $LOCAL_CLIENT_DIST"
        echo "提示：部署前请先在本地运行 'pnpm build'"
        exit 1
    fi
    print_success "前端构建产物已找到 ($(du -sh "$LOCAL_CLIENT_DIST" | cut -f1))"

    if [[ ! -d "$LOCAL_SERVER_DIST" ]]; then
        print_error "后端构建产物未找到: $LOCAL_SERVER_DIST"
        echo "提示：部署前请先在本地运行 'pnpm build'"
        exit 1
    fi
    print_success "后端构建产物已找到 ($(du -sh "$LOCAL_SERVER_DIST" | cut -f1))"

    # 检查 SSH 连接（如果使用远程部署）
    # read -p "部署类型 (local/remote): " DEPLOY_TYPE
    DEPLOY_TYPE="local"

    echo ""
    }

# ============================================
# 安装系统依赖
# ============================================
install_dependencies() {
    print_header "安装系统依赖"

    print_step "更新 apt 缓存..."
    apt update -qq

    print_step "安装基础软件包..."
    apt install -y -qq \
        curl \
        wget \
        git \
        vim \
        htop \
        unzip \
        gnupg2 \
        ca-certificates \
        lsb-release \
        software-properties-common \
        > /dev/null 2>&1
    print_success "基础软件包安装完成"

    print_step "安装 Nginx..."
    apt install -y -qq nginx > /dev/null 2>&1
    print_success "Nginx 安装完成 (版本: $(nginx -v 2>&1 | cut -d'/' -f2))"

    print_step "安装 Certbot (Let's Encrypt)..."
    apt install -y -qq certbot python3-certbot-nginx > /dev/null 2>&1
    print_success "Certbot 安装完成 (版本: $(certbot --version 2>&1))"

    print_step "安装 Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - > /dev/null 2>&1
    apt install -y -qq nodejs > /dev/null 2>&1
    print_success "Node.js 安装完成 (版本: $(node -v))"

    print_step "安装 PNPM..."
    npm install -g pnpm > /dev/null 2>&1
    print_success "PNPM 安装完成 (版本: $(pnpm -v))"

    print_step "安装 PM2..."
    npm install -g pm2 > /dev/null 2>&1
    print_success "PM2 安装完成 (版本: $(pm2 -v))"

    echo ""
}

# ============================================
# 创建目录结构
# ============================================
create_directories() {
    print_header "创建目录结构"

    print_step "创建部署目录..."
    mkdir -p "$DEPLOY_PATH"
    mkdir -p "$DEPLOY_PATH/client"
    mkdir -p "$DEPLOY_PATH/server"
    mkdir -p "$DEPLOY_PATH/server/dist"
    mkdir -p "$DEPLOY_PATH/server/uploads"
    mkdir -p "$DEPLOY_PATH/certbot/.well-known/acme-challenge"

    print_step "设置目录权限..."
    chown -R $SERVER_USER:$SERVER_USER "$DEPLOY_PATH"
    chmod -R 755 "$DEPLOY_PATH"

    print_success "目录结构创建完成"
    echo """
    目录结构:
    $DEPLOY_PATH/
    ├── client/
    │   └── dist/
    ├── server/
    │   ├── dist/
    │   └── uploads/
    └── certbot/
        └── .well-known/
            └── acme-challenge/
    """
}

# ============================================
# 部署前端
# ============================================
deploy_frontend() {
    print_header "部署前端"

    print_step "清理旧的前端构建产物..."
    rm -rf "$DEPLOY_PATH/client/dist"
    mkdir -p "$DEPLOY_PATH/client"

    print_step "复制前端构建产物到服务器..."
    cp -r "$LOCAL_CLIENT_DIST" "$DEPLOY_PATH/client/"

    print_step "设置权限..."
    chown -R $SERVER_USER:$SERVER_USER "$DEPLOY_PATH/client"
    chmod -R 755 "$DEPLOY_PATH/client/dist"

    print_success "前端部署完成"
    echo "前端访问路径: $DEPLOY_PATH/client/dist"
}

# ============================================
# 部署后端
# ============================================
deploy_backend() {
    print_header "部署后端"

    print_step "清理旧的后端构建产物..."
    rm -rf "$DEPLOY_PATH/server/dist"
    mkdir -p "$DEPLOY_PATH/server"

    print_step "复制后端构建产物到服务器..."
    cp -r "$LOCAL_SERVER_DIST" "$DEPLOY_PATH/server/"

    print_step "复制上传文件目录..."
    if [[ -d "./server/uploads" ]]; then
        rm -rf "$DEPLOY_PATH/server/uploads"
        cp -r "./server/uploads" "$DEPLOY_PATH/server/"
    fi

    print_step "设置权限..."
    chown -R $SERVER_USER:$SERVER_USER "$DEPLOY_PATH/server"
    chmod -R 755 "$DEPLOY_PATH/server"

    print_success "后端部署完成"
    echo "后端路径: $DEPLOY_PATH/server/dist"
}

# ============================================
# 配置 Nginx
# ============================================
configure_nginx() {
    print_header "配置 Nginx"

    print_step "备份原有 Nginx 默认配置..."
    if [[ -f /etc/nginx/sites-available/default ]]; then
        cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d%H%M%S)
    fi

    print_step "创建 Nginx 配置文件..."

    cat > /etc/nginx/sites-available/axis-o << 'EOF'
# ============================================
# AXIS O - Nginx 配置文件
# 自动生成 by deploy.sh
# ============================================

# HTTP -> HTTPS 重定向
server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;

    # Let's Encrypt 证书验证
    location /.well-known/acme-challenge/ {
        root /var/www/axis-o/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS 主服务器
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;

    # ============================================
    # SSL 证书配置（Certbot 自动管理）
    # ============================================
    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;

    # SSL 安全设置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # 安全响应头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # ============================================
    # 日志配置
    # ============================================
    access_log /var/log/nginx/axis-o.access.log;
    error_log /var/log/nginx/axis-o.error.log;

    # ============================================
    # 前端静态文件
    # ============================================
    root /var/www/axis-o/client/dist;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # HTML 不缓存
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # ============================================
    # API 反向代理
    # ============================================
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        client_max_body_size 50M;

        proxy_cache_bypass $http_upgrade;
    }

    # 健康检查
    location /api/health {
        proxy_pass http://127.0.0.1:3001/api/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }

    # ============================================
    # 上传文件
    # ============================================
    location /uploads {
        alias /var/www/axis-o/server/uploads;
        expires 1d;
        add_header Cache-Control "public";
        access_log off;
    }

    # ============================================
    # 安全设置
    # ============================================
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~* \.(env|git|htaccess|log|sh|sql|conf|bak)$ {
        deny all;
        access_log off;
        log_not_found off;
    }

    # ============================================
    # 错误页面
    # ============================================
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
        internal;
    }
}
EOF

    # 替换占位符
    sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/axis-o

    print_step "启用站点配置..."
    ln -sf /etc/nginx/sites-available/axis-o /etc/nginx/sites-enabled/axis-o

    # 禁用默认配置（如果有）
    if [[ -f /etc/nginx/sites-enabled/default ]]; then
        rm -f /etc/nginx/sites-enabled/default
    fi

    print_step "测试 Nginx 配置..."
    if nginx -t; then
        print_success "Nginx 配置测试通过"
    else
        print_error "Nginx 配置测试失败"
        exit 1
    fi

    print_step "重载 Nginx..."
    systemctl reload nginx

    print_success "Nginx 配置完成"
}

# ============================================
# 获取 SSL 证书
# ============================================
obtain_ssl_cert() {
    print_header "获取 SSL 证书"

    print_step "停止 Nginx（Certbot 需要端口 80）..."
    systemctl stop nginx

    print_step "请求 Let's Encrypt 证书..."
    print_warning "请确保域名 $DOMAIN 已正确解析到本服务器 IP"

    certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        --pre-hook "nginx -s stop" \
        --post-hook "systemctl start nginx" \
        -d "$DOMAIN" \
        -d "www.$DOMAIN"

    if [[ $? -eq 0 ]]; then
        print_success "SSL 证书获取成功"
    else
        print_error "SSL 证书获取失败，请检查域名解析和防火墙设置"
        print_step "启动 Nginx 继续..."
        systemctl start nginx
        exit 1
    fi

    print_step "启动 Nginx..."
    systemctl start nginx

    print_step "设置证书自动续期..."
    echo "0 0 * * * root certbot renew --quiet --deploy-hook 'systemctl reload nginx'" >> /etc/crontab
    print_success "证书自动续期已配置（每天凌晨检查）"
}

# ============================================
# 配置后端环境变量
# ============================================
configure_backend_env() {
    print_header "配置后端环境变量"

    ENV_FILE="$DEPLOY_PATH/server/.env.production"

    print_step "创建后端环境变量文件..."
    print_warning "请根据实际情况修改以下配置"

    cat > "$ENV_FILE" << 'EOF'
# ============================================
# AXIS O - 生产环境配置
# ============================================

NODE_ENV=production
PORT=3001

# 数据库
DATABASE_URL=mysql://username:password@localhost:3306/axis_o

# JWT（请修改为强密钥）
JWT_SECRET=change-this-to-a-strong-secret-key-at-least-64-characters
JWT_REFRESH_SECRET=change-this-to-another-strong-secret-key

# CORS（修改为你的域名）
CORS_ORIGIN=https://your-domain.com

# Stripe（生产密钥）
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# PayPal（生产配置）
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=live

# Email
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@your-domain.com

# API
API_BASE_URL=https://your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
EOF

    chown $SERVER_USER:$SERVER_USER "$ENV_FILE"
    chmod 600 "$ENV_FILE"

    print_success "环境变量文件已创建: $ENV_FILE"
    print_warning "请编辑该文件并填入实际的配置值"
    echo """
    提示：运行以下命令编辑配置：
    nano $ENV_FILE
    """
}

# ============================================
# 配置客户端环境变量
# ============================================
configure_frontend_env() {
    print_header "配置前端环境变量"

    ENV_FILE="$DEPLOY_PATH/client/.env.production"

    print_step "创建前端环境变量文件..."

    cat > "$ENV_FILE" << 'EOF'
VITE_API_BASE_URL=https://your-domain.com/api
EOF

    chown $SERVER_USER:$SERVER_USER "$ENV_FILE"
    chmod 644 "$ENV_FILE"

    print_success "前端环境变量文件已创建: $ENV_FILE"
    print_warning "请编辑该文件并填入实际的 API 地址"
}

# ============================================
# 启动后端服务
# ============================================
start_backend() {
    print_header "启动后端服务"

    print_step "检查环境变量配置..."
    if grep -q "change-this" "$DEPLOY_PATH/server/.env.production"; then
        print_warning "检测到未修改的环境变量，请先编辑: $DEPLOY_PATH/server/.env.production"
        read -p "是否跳过并继续？(y/N): " confirm
        if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
            exit 1
        fi
    fi

    print_step "进入后端目录..."
    cd "$DEPLOY_PATH/server"

    print_step "安装后端依赖..."
    npm install --production --silent > /dev/null 2>&1

    print_step "使用 PM2 启动服务..."
    if pm2 list | grep -q "axis-api"; then
        print_step "重启已有进程..."
        pm2 restart axis-api
    else
        print_step "创建新进程..."
        pm2 start dist/server/src/index.js --name axis-api
    fi

    print_step "保存 PM2 进程列表..."
    pm2 save

    print_step "设置 PM2 开机自启..."
    pm2 startup > /dev/null 2>&1

    sleep 2

    print_step "检查服务状态..."
    if pm2 list | grep -q "axis-api.*online"; then
        print_success "后端服务运行中"
        pm2 list
    else
        print_error "后端服务启动失败，请检查日志："
        pm2 logs axis-api --lines 20
        exit 1
    fi

    echo ""
}

# ============================================
# 配置防火墙
# ============================================
configure_firewall() {
    print_header "配置防火墙"

    if command -v ufw &> /dev/null; then
        print_step "配置 UFW 防火墙..."

        ufw --force enable
        ufw allow ssh
        ufw allow http
        ufw allow https

        print_success "防火墙配置完成"
        echo """
        当前防火墙规则:
        $(ufw status)
        """
    else
        print_warning "UFW 未安装，跳过防火墙配置"
    fi
}

# ============================================
# 验证部署
# ============================================
verify_deployment() {
    print_header "验证部署"

    print_step "检查 Nginx 状态..."
    systemctl status nginx --no-pager | head -5

    echo ""

    print_step "检查后端服务状态..."
    pm2 list

    echo ""

    print_step "测试 API 端点..."
    if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/api/health | grep -q "200"; then
        print_success "API 健康检查通过"
    else
        print_warning "API 健康检查未通过（可能需要配置数据库）"
    fi

    echo ""
    }

# ============================================
# 打印部署完成信息
# ============================================
print_complete() {
    print_header "🎉 部署完成！"

    echo """
    ============================================
    访问信息
    ============================================
    前端地址:    https://$DOMAIN
    API 地址:    https://$DOMAIN/api
    后端端口:    $NODE_PORT

    ============================================
    管理命令
    ============================================
    查看后端日志:    pm2 logs axis-api
    重启后端:        pm2 restart axis-api
    查看后端状态:    pm2 list

    Nginx 管理:
    - 重载配置:      systemctl reload nginx
    - 重启 Nginx:    systemctl restart nginx
    - 查看状态:      systemctl status nginx

    SSL 证书:
    - 手动续期:      certbot renew
    - 查看证书:      certbot certificates

    ============================================
    后续步骤
    ============================================
    1. 编辑后端环境变量:
       nano $DEPLOY_PATH/server/.env.production

    2. 运行数据库迁移:
       cd $DEPLOY_PATH/server
       pnpm db:migrate

    3. 创建管理员账户:
       node scripts/createAdmin.js

    4. 配置支付网关 Webhook（Stripe/PayPal）

    ============================================
    """
}

# ============================================
# 主函数
# ============================================
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  AXIS O 一键部署脚本${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "域名: ${YELLOW}$DOMAIN${NC}"
    echo -e "邮箱: ${YELLOW}$EMAIL${NC}"
    echo -e "路径: ${YELLOW}$DEPLOY_PATH${NC}"
    echo ""

    read -p "确认开始部署？(y/N): " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        echo "部署已取消"
        exit 0
    fi

    preflight_check
    install_dependencies
    create_directories
    deploy_frontend
    deploy_backend
    configure_nginx
    obtain_ssl_cert
    configure_backend_env
    configure_frontend_env
    start_backend
    configure_firewall
    verify_deployment
    print_complete
}

# 运行主函数
main "$@"
