/**
 * 方案一：URL 路径版本控制
 * 例子：访问 /api/v1/users 或 /api/v2/users
 * 最直观，浏览器地址栏可见，调试方便。	路径显得冗长，违反了“一个资源对应一个 URL”的原则。
 */
const urlVersioning = (version) => (req, res, next) => {
    // 检查请求路径是否以指定的版本号开头（例如：/api/v1）
    if (req.path.startsWith(`/api/${version}`)) {
        next(); // 版本匹配，进入下一个中间件或路由
    } else {
        // 版本不匹配，返回 404 错误
        res.status(404).json({
            success: false,
            error: "API version is not supported",
        });
    }
};

/**
 * 方案二：自定义请求头版本控制
 * 例子：请求头中包含 Accept-Version: v1
 * RL 保持干净，符合 RESTful 理念。	浏览器无法直接预览，必须用代码或工具（Postman）设置 Header。
 */
const headerVersioning = (version) => (req, res, next) => {
    // 从请求头中获取 "Accept-Version" 的值并与预设版本对比
    if (req.get("Accept-Version") === version) {
        next();
    } else {
        res.status(404).json({
            success: false,
            error: "API version is not supported",
        });
    }
};

/**
 * 方案三：媒体类型（Content-Type）版本控制
 * 例子：Content-Type: application/vnd.api.v1+json
 * 最专业，符合 HTTP 标准的“内容协商”逻辑。	配置最复杂，前端调用时门槛略高。
 */
const contentTypeVersioning = (version) => (req, res, next) => {
    const contentType = req.get("Content-Type");

    // 检查 Content-Type 是否包含特定的供应商媒体类型字符串
    if (
        contentType &&
        contentType.includes(`application/vnd.api.${version}+json`)
    ) {
        next();
    } else {
        res.status(404).json({
            success: false,
            error: "API version is not supported",
        });
    }
};

module.exports = { urlVersioning, headerVersioning, contentTypeVersioning };