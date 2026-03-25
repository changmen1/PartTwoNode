const cors = require("cors");

/**
 * 配置 CORS 中间件的函数
 * 这种写法比 app.use(cors()) 更安全，因为它限制了谁可以访问你的 API
 */
const configureCors = () => {
    return cors({
        // origin (源) -> 告诉后端，哪些前端地址（域名/IP）可以访问这个 API
        origin: (origin, callback) => {
            const allowedOrigins = [
                "http://localhost:3000",        // 本地开发环境（React 默认端口）
                "https://yourcustomdomain.com", // 线上生产环境域名
            ];

            // 逻辑判断：
            // !origin: 允许没有源的请求（比如移动端 App、Postman 或服务器端发起的请求）
            // indexOf(origin) !== -1: 检查请求的来源是否在我们的白名单里
            if (!origin || allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true); // 验证通过，允许请求访问
            } else {
                // 验证失败，抛出错误，浏览器控制台会看到 "CORS error"
                callback(new Error("当前来源不允许跨域访问 (Not allowed by cors)"));
            }
        },

        // 允许的 HTTP 请求方法
        methods: ["GET", "POST", "PUT", "DELETE"],

        // 允许前端发送的自定义请求头
        // Authorization: 非常重要，因为你要用它发送 JWT Token
        allowedHeaders: ["Content-Type", "Authorization", "Accept-Version"],

        // 允许前端访问的后端响应头
        // 默认情况下前端只能看到简单的头，如果你要在前端获取分页总数（如 X-Total-Count），必须在这里暴露
        exposedHeaders: ["X-Total-Count", "Content-Range"],

        // 允许携带凭证
        // 如果你的 JWT 存放在 Cookie 中，或者需要发送 Session ID，这里必须设为 true
        credentials: true,

        // 是否将预检请求（OPTIONS）传递给下一个路由处理器，通常设为 false
        preflightContinue: false,

        // 预检请求的缓存时间（单位：秒）
        // 这里设为 600 秒（10 分钟）。这意味着浏览器在 10 分钟内不会重复发送 OPTIONS 请求
        // 这能显著减少后端压力，提高前端接口响应速度
        maxAge: 600,

        // 针对某些旧版浏览器（如 IE11），在成功处理 OPTIONS 预检请求时返回的状态码
        optionsSuccessStatus: 204,
    });
};

module.exports = { configureCors };