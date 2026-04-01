const logger = require("../utils/logger");
const jwt = require("jsonwebtoken");

/**
 * 验证 Token 的中间件
 * 它的作用是拦截请求，检查用户是否有合法的身份令牌（JWT）
 */
const validateToken = (req, res, next) => {
    // 1. 从请求头（Headers）中获取 Authorization 字段
    // 标准格式通常是: "Bearer <your_token>"
    const authHeader = req.headers["authorization"];

    // 2. 提取 Token：如果 authHeader 存在，则用空格分割并取第二部分
    const token = authHeader && authHeader.split(" ")[1];

    // 3. 检查 Token 是否缺失
    if (!token) {
        logger.warn("未携带有效 Token 的访问尝试！");
        return res.status(401).json({
            message: "需要身份验证",
            success: false,
        });
    }

    // 4. 使用 JWT 密钥验证 Token 的有效性
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        // 如果验证失败（比如 Token 过期、被篡改或密钥不对）
        if (err) {
            logger.warn("无效的 Token！");
            return res.status(429).json({
                message: "无效的 Token！",
                success: false,
            });
        }

        /**
         * 5. 【最关键的一步】
         * 验证成功后，jwt.verify 会把解密出来的用户信息（user 对象）
         * 挂载到当前的请求对象 (req) 上。
         * 这样后续的中间件或路由代理就能通过 req.user 拿到用户 ID 了。
         */
        req.user = user;

        // 6. 验证通过，放行，进入下一个中间件（在你的网关里就是进入 proxy 逻辑）
        next();
    });
};

module.exports = { validateToken };