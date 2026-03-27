const winston = require("winston");

/**
 * 创建 Winston 日志记录器实例
 */
const logger = winston.createLogger({
    // 1. 设置最低日志记录级别
    // 生产环境只记录 info 及以上（忽略 debug），开发环境记录所有（包括 debug）
    level: process.env.NODE_ENV === "production" ? "info" : "debug",

    // 2. 定义全局日志格式（组合模式）
    format: winston.format.combine(
        winston.format.timestamp(),      // 加上时间戳
        winston.format.errors({ stack: true }), // 如果传入的是 Error 对象，自动打印错误堆栈（关键！）
        winston.format.splat(),          // 支持字符串插值，如 logger.info('Hi %s', 'user')
        winston.format.json()            // 将最终日志输出为 JSON 格式（适合机器阅读和 ELK 采集）
    ),

    // 3. 默认元数据：每条日志都会自动带上这个字段，方便在海量日志中区分是哪个微服务产生的
    defaultMeta: { service: "api-gatway" },

    // 4. 定义日志的去向（传输通道）
    transports: [
        // 通道 A: 打印到控制台（给人看的）
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),   // 让日志级别带颜色（info绿色，error红色）
                winston.format.simple()      // 控制台不需要 JSON，用简单的字符串格式展示
            ),
        }),

        // 通道 B: 将错误日志单独存入文件
        // 只记录 level 为 error 的信息，方便快速排查线上 Bug
        new winston.transports.File({ filename: "error.log", level: "error" }),

        // 通道 C: 将所有日志存入综合文件
        // 包含 info, warn, error 等所有符合全局 level 设定的日志
        new winston.transports.File({ filename: "combined.log" }),
    ],
});

module.exports = logger;