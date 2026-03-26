require("dotenv").config();
const mongoose = require("mongoose");
const logger = require("./utils/logger");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const Redis = require("ioredis");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const routes = require("./routes/identity-service");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3001;

//connect to mongodb
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => logger.info("Connected to mongodb"))
    .catch((e) => logger.error("Mongo connection error", e));

const redisClient = new Redis(process.env.REDIS_URL);

//middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body, ${req.body}`);
    next();
});

//DDoS防护和速率限制 5秒内提出6个请求
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "middleware",
    points: 6,
    duration: 5,
});

app.use((req, res, next) => {
    rateLimiter
        .consume(req.ip)
        .then(() => next())
        .catch(() => {
            logger.warn(`这个蛋蛋请求频率的太快了 IP: ${req.ip}`);
            res.status(429).json({ success: false, message: "蛋蛋请求那么快干撒嘛哎呀~" });
        });
});

// 基于 IP 的敏感端点速率限制
const sensitiveEndpointsLimiter = rateLimit({
    // 定义时间窗口。这里是 15 分钟（15 * 60秒 * 1000毫秒）
    windowMs: 15 * 60 * 1000,
    // 在这个窗口期内，同一个 IP 最多只能请求 50 次。
    max: 50,
    // 在返回的响应头里加上 RateLimit-* 字段，告诉前端：“你还剩几次机会”、“多久后重置”
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`敏感端点速率限制已超出 IP: ${req.ip}`);
        res.status(429).json({ success: false, message: "蛋蛋请求那么快干撒嘛哎呀~" });
    },
    // 它告诉程序：“不要把计数器存在内存里，存到 Redis 里去”。这样即使你重启了服务器，限流计数也不会丢失，多台服务器也能同步数据。
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
});

//将此 sensitiveEndpointsLimiter 应用于我们的路由
app.use("/api/auth/register", sensitiveEndpointsLimiter);

//Routes
app.use("/api/auth", routes);

//error handler
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`Identity service running on port ${PORT}`);
});

// !监控录像，负责记录代码里没考虑到错误捕获、漏掉的突发崩溃。
process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at", promise, "reason:", reason);
});