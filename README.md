# MindArchive Frontend

这个前端现在按 `agentic_rag` 后端来接，默认参考你旧项目 `E:\front_vue\mneme_frontend` 里的接入配置：

- 本地开发后端：`http://127.0.0.1:8000`
- 生产后端公网 IP：`http://124.223.14.145:8000`
- 推荐前端域名：`www.mneme.com.cn`
- 推荐 Nginx 做法：前端页面走静态资源，`/api` 反向代理到后端

## 本地运行

1. 安装依赖

```bash
npm install
```

2. 按需配置环境变量，默认值已经适合本地联调

```env
VITE_API_BASE_URL=/api
VITE_API_PREFIX=
VITE_PROXY_TARGET=http://127.0.0.1:8000
```

3. 启动开发服务器

```bash
npm run dev
```

本地开发时，浏览器访问的是前端自己的 `/api`，Vite 会把它代理到 `http://127.0.0.1:8000`，这样通常不需要额外处理 CORS。

## 生产部署建议

生产环境推荐继续沿用旧项目的方式：浏览器只访问前端域名，再由 Nginx 把 `/api` 转发到后端。

示例：

```nginx
location /api/ {
    rewrite ^/api/?(.*)$ /$1 break;
    proxy_pass http://124.223.14.145:8000;
    proxy_http_version 1.1;
    proxy_set_header Host $proxy_host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

对应前端环境变量建议是：

```env
VITE_API_BASE_URL=/api
VITE_API_PREFIX=
```

如果你不走 Nginx，而是让前端直接请求后端公网 IP，那么可以改成：

```env
VITE_API_BASE_URL=http://124.223.14.145:8000
VITE_API_PREFIX=
```

这种情况下，后端必须把真实前端来源加入 `CORS_ALLOWED_ORIGINS`。
