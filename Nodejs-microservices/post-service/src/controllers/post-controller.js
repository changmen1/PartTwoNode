const Post = require("../models/Post");
const logger = require("../utils/logger");

const createPost = async (req, res) => {
    logger.info("Create post endpoint hit");
    try {
        const { content, mediaIds } = req.body;
        const newlyCreatedPost = new Post({
            user: req.user.userId,
            content,
            mediaIds: mediaIds || [],
        });

        await newlyCreatedPost.save();

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

module.exports = { createPost };