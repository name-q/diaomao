FROM node:18-alpine

# 安装 pnpm 8
RUN npm install -g pnpm@8

WORKDIR /app

# 复制package文件
COPY package*.json pnpm-lock.yaml* ./

# 安装依赖
RUN pnpm install --prod --frozen-lockfile

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 7001

# 启动应用
CMD ["pnpm", "start"]