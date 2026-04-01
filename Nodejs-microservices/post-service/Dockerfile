# 1. 基础镜像：指定运行环境
# node:18 是版本，alpine 是一个极简的 Linux 发行版（只有 5MB 左右），非常省空间
FROM node:18-alpine

# 2. 工作目录：类似于在 Linux 里执行 cd /usr/src/app
# 之后的所有命令（COPY, RUN 等）都会在这个目录下执行
WORKDIR /use/src/app

# 3. 复制依赖描述文件：
# 先只复制 package.json 和 package-lock.json
# 这样做是为了利用 Docker 的“层缓存”机制：如果依赖没变，下次构建会跳过安装步骤，极快！
COPY package*.json ./

# 4. 安装依赖：
# npm ci 类似于 npm install，但它专为自动化环境设计，安装更快速、更可靠
# --only=production 表示只安装生产环境需要的包（忽略 devDependencies），减小镜像体积
RUN npm ci --only=production

# 5. 复制源代码：
# 把你电脑当前目录下的所有文件都拷贝到容器的工作目录里
COPY . .

# 6. 声明端口：
# 告诉 Docker 这个程序在容器内部监听的是 3000 端口
# 这只是一个声明，实际运行时还需要在命令中做映射
EXPOSE 3002

# 7. 启动命令：
# 容器启动时执行的最终指令，通常是一个长驻进程
CMD ["node", "src/server.js"]