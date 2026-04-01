const Search = require("../models/Search");
const logger = require("../utils/logger");

/**
 * 搜索帖子控制器
 * 实现了基于 MongoDB 全文索引的搜索
 */
const searchPostController = async (req, res) => {
    logger.info("搜索接口被调用");
    try {
        // 从查询参数中获取搜索关键词（例如：/search?query=react）
        const { query } = req.query;

        console.log('搜索服务的入参:', query);

        // 执行 MongoDB 全文搜索
        const results = await Search.find(
            {
                // 使用 $text 操作符进行全文检索，前提是 Schema 中必须建立了 text 索引
                $text: { $search: query },
            },
            {
                // $meta: "textScore" 会返回一个评分，代表搜索关键词与文档的匹配程度
                score: { $meta: "textScore" },
            }
        )
            // 根据匹配评分（权重）从高到低排序，确保最相关的结果排在前面
            .sort({ score: { $meta: "textScore" } })
            // 限制返回前 10 条结果，提高响应速度
            .limit(10);

        res.json(results);
    } catch (e) {
        logger.error("搜索帖子时发生错误", e);
        res.status(500).json({
            success: false,
            message: "搜索帖子失败",
        });
    }
};

module.exports = { searchPostController };