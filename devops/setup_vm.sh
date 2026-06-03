#!/usr/bin/env bash
# Ubuntu bare-metal one-shot setup for smart-resume-app
# Usage: bash devops/setup_vm.sh  (from project root, or any path)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/backend"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"
DATA_DIR="${PROJECT_ROOT}/data"

echo "=========================================="
echo "  Smart Resume — Ubuntu 环境一键安装"
echo "=========================================="
echo "项目目录: ${PROJECT_ROOT}"
echo ""

if [[ "$(id -u)" -eq 0 ]]; then
  echo "[提示] 检测到 root 用户，将直接执行系统安装。"
  SUDO=""
else
  SUDO="sudo"
  echo "[提示] 将使用 sudo 安装系统依赖（可能需要输入密码）。"
fi
echo ""

echo ">>> [1/6] 更新 apt 软件源..."
${SUDO} apt-get update -y

echo ""
echo ">>> [2/6] 安装 Nginx、Python venv、curl、git 等基础包..."
${SUDO} apt-get install -y \
  nginx \
  python3 \
  python3-venv \
  python3-pip \
  curl \
  ca-certificates \
  gnupg \
  git

echo ""
echo ">>> [3/6] 安装 Node.js 20.x 与 npm..."
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | ${SUDO} -E bash -
  ${SUDO} apt-get install -y nodejs
else
  echo "    Node.js 已满足版本要求: $(node -v)"
fi
echo "    Node: $(node -v)  npm: $(npm -v)"

echo ""
echo ">>> [4/6] 全局安装 PM2 进程守护..."
${SUDO} npm install -g pm2
echo "    PM2 版本: $(pm2 -v)"

echo ""
echo ">>> [5/6] 构建前端 (npm install & npm run build)..."
cd "${FRONTEND_DIR}"
export NEXT_TELEMETRY_DISABLED=1
npm install
npm run build
echo "    前端构建完成。"

echo ""
echo ">>> [6/6] 配置后端 Python 虚拟环境并安装依赖..."
cd "${BACKEND_DIR}"
if [[ ! -d venv ]]; then
  python3 -m venv venv
  echo "    已创建 venv。"
fi
# shellcheck source=/dev/null
source venv/bin/activate
pip install --upgrade pip
pip install --no-cache-dir -r requirements.txt \
  -i https://pypi.tuna.tsinghua.edu.cn/simple
deactivate
echo "    后端依赖安装完成。"

mkdir -p "${DATA_DIR}" "${PROJECT_ROOT}/logs"
echo ""
echo ">>> 已确保数据目录存在: ${DATA_DIR}"
echo ">>> 已确保 PM2 日志目录存在: ${PROJECT_ROOT}/logs"

if [[ ! -f "${PROJECT_ROOT}/.env" && ! -f "${BACKEND_DIR}/.env" ]]; then
  echo ""
  echo "[警告] 未找到 .env 文件。请复制 backend/.env.example 并配置 OPENAI_API_KEY："
  echo "       cp ${BACKEND_DIR}/.env.example ${BACKEND_DIR}/.env"
fi

echo ""
echo "=========================================="
echo "  基础环境安装完成！"
echo "=========================================="
echo ""
echo "后续步骤（请手动或以 sudo 执行）："
echo ""
echo "  1) 部署 Nginx 反向代理："
echo "     sudo cp ${SCRIPT_DIR}/nginx.conf /etc/nginx/sites-available/smart-resume"
echo "     sudo ln -sf /etc/nginx/sites-available/smart-resume /etc/nginx/sites-enabled/"
echo "     sudo rm -f /etc/nginx/sites-enabled/default"
echo "     sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "  2) 使用 PM2 启动前后端："
echo "     cd ${SCRIPT_DIR}"
echo "     pm2 start ecosystem.config.js"
echo "     pm2 save"
echo "     pm2 startup   # 按提示配置开机自启"
echo ""
echo "  3) 浏览器访问: http://<服务器IP>/"
echo ""
echo "=========================================="
