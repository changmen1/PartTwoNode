const Post = require("../models/Post");
const logger = require("../utils/logger");
const { validateCreatePost } = require("../utils/validation");

/**
 * 失效帖子缓存的工具函数
 * @param {Object} req - Express 请求对象，用于访问 redisClient
 * @param {string} input - 帖子的 ID
 */
async function invalidatePostCache(req, input) {
    // 1. 定义单个帖子的缓存 Key（例如 post:12345）
    const cachedKey = `post:${input}`;

    // 2. 删除这个特定帖子的缓存数据
    // 当这个帖子被修改或删除后，如果不删掉这个 Key，用户查到的还是旧数据
    await req.redisClient.del(cachedKey);

    // 3. 查找所有分页列表的缓存 Key
    // 因为新增或删除了帖子，所有的分页列表（第一页、第二页等）的排序和内容都变了
    // 所以需要找到所有以 "posts:" 开头的缓存（例如 posts:1:10, posts:2:10）
    const keys = await req.redisClient.keys("posts:*");

    // 4. 如果找到了相关的分页列表 Key，则全部批量删除
    if (keys.length > 0) {
        await req.redisClient.del(keys);
    }

    // 结果：下次用户调用 getAllPosts 或 getPost 时，发现缓存没了，
    // 就会去查数据库，从而拿到最新数据并重新存入缓存。
}

const createPost = async (req, res) => {
    logger.info("Create post endpoint hit");
    try {
        //validate the schema
        const { error } = validateCreatePost(req.body);
        if (error) {
            logger.warn("Validation error", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }
        const { content, mediaIds } = req.body;
        const newlyCreatedPost = new Post({
            user: req.user.userId,
            content,
            mediaIds: mediaIds || [],
        });

        await newlyCreatedPost.save();

        await invalidatePostCache(req, newlyCreatedPost._id.toString());
        logger.info("Post created successfully", newlyCreatedPost);

        res.status(201).json({
            success: true,
            message: "Post created successfully",
        });
    } catch (e) {
        logger.error("Error creating post", error);
        res.status(500).json({
            success: false,
            message: "Error creating post",
        });
    }
};

const getAllPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;

        const cachekey = `posts:${page}:${limit}`;
        const cachedPosts = await req.redisClient.get(cachekey);

        if (cachedPosts) {
            return res.json(JSON.parse(cachedPosts));
        }

        const posts = await Post.find({})
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(limit);

        const totalNoOfPosts = await Post.countDocuments();

        const result = {
            posts,
            currentpage: page,
            totalPages: Math.ceil(totalNoOfPosts / limit),
            totalPosts: totalNoOfPosts,
        };

        //save your posts in redis cache
        await req.redisClient.setex(cachekey, 300, JSON.stringify(result));

        res.json(result);
    } catch (e) {
        logger.error("Error fetching posts", error);
        res.status(500).json({
            success: false,
            message: "Error fetching posts",
        });
    }
}

const getPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const cachekey = `post:${postId}`;
        const cachedPost = await req.redisClient.get(cachekey);

        if (cachedPost) {
            return res.json(JSON.parse(cachedPost));
        }

        const singlePostDetailsbyId = await Post.findById(postId);

        if (!singlePostDetailsbyId) {
            return res.status(404).json({
                message: "Post not found",
                success: false,
            });
        }

        await req.redisClient.setex(
            cachekey,
            3600,
            JSON.stringify(singlePostDetailsbyId)
        );

        res.json(singlePostDetailsbyId);
    } catch (e) {
        logger.error("Error fetching post", error);
        res.status(500).json({
            success: false,
            message: "Error fetching post by ID",
        });
    }
};

const deletePost = async (req, res) => {
    try {
        const post = await Post.findOneAndDelete({
            _id: req.params.id,
            user: req.user.userId,
        });

        if (!post) {
            return res.status(404).json({
                message: "Post not found",
                success: false,
            });
        }

        await invalidatePostCache(req, req.params.id);
        res.json({
            message: "Post deleted successfully",
        });
    } catch (e) {
        logger.error("Error deleting post", error);
        res.status(500).json({
            success: false,
            message: "Error deleting post",
        });
    }
};

module.exports = { createPost, getAllPosts, getPost, deletePost };