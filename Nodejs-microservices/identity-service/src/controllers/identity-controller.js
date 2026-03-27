const RefreshToken = require("../modules/RefreshToken");
const User = require("../modules/User");
const generateTokens = require("../utils/generateToken");
const logger = require("../utils/logger");
const { validateRegistration, validatelogin } = require("../utils/validation");

// 用户注册
const resgiterUser = async (req, res) => {
    logger.info("注册开始...");
    try {
        //validate the schema
        const { error } = validateRegistration(req.body);
        if (error) {
            logger.warn("Validation error", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }
        const { email, password, username } = req.body;

        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            logger.warn("用户已存在");
            return res.status(400).json({
                success: false,
                message: "用户已存在",
            });
        }

        user = new User({ username, email, password });
        await user.save();
        logger.warn("用户注册成功", user._id);

        const { accessToken, refreshToken } = await generateTokens(user);

        res.status(201).json({
            success: true,
            message: "用户注册成功!",
            accessToken,
            refreshToken,
        });
    } catch (e) {
        logger.error("注册出错", e);
        res.status(500).json({
            success: false,
            message: "内部服务器错误",
        });
    }
}

// 用户登录
const loginUser = async (req, res) => {
    logger.info("用户正在登录...");
    try {
        const { error } = validatelogin(req.body);
        if (error) {
            logger.warn("Validation error", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            logger.warn("Invalid user");
            return res.status(400).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        // user valid password or not
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            logger.warn("Invalid password");
            return res.status(400).json({
                success: false,
                message: "Invalid password",
            });
        }

        const { accessToken, refreshToken } = await generateTokens(user);

        res.json({
            accessToken,
            refreshToken,
            userId: user._id,
        });
    } catch (e) {
        logger.error("登录失败", e);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// 刷新token
const refreshTokenUser = async (req, res) => {
    logger.info("Refresh token endpoint hit...");
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            logger.warn("刷新令牌缺失");
            return res.status(400).json({
                success: false,
                message: "刷新令牌缺失",
            });
        }
        const storedToken = await RefreshToken.findOne({ token: refreshToken });

        await RefreshToken.deleteOne({ token: refreshToken });

        if (!storedToken) {
            logger.warn("提供的刷新令牌无效");
            return res.status(400).json({
                success: false,
                message: "提供的刷新令牌无效",
            });
        }

        if (!storedToken || storedToken.expiresAt < new Date()) {
            logger.warn("无效或已过期的刷新令牌");

            return res.status(401).json({
                success: false,
                message: `无效或已过期的刷新令牌`,
            });
        }

        const user = await User.findById(storedToken.user);

        if (!user) {
            logger.warn("用户未找到");

            return res.status(401).json({
                success: false,
                message: `用户未找到`,
            });
        }

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            await generateTokens(user);

        //delete the old refresh token
        await RefreshToken.deleteOne({ _id: storedToken._id });

        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });

    } catch (e) {
        logger.error("Refresh token error occured", e);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}

// 退出登录
const logoutUser = async (req, res) => {
    logger.info("Logout endpoint hit...");
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            logger.warn("Refresh token missing");
            return res.status(400).json({
                success: false,
                message: "Refresh token missing",
            });
        }

        const storedToken = await RefreshToken.findOneAndDelete({
            token: refreshToken,
        });
        if (!storedToken) {
            logger.warn("Invalid refresh token provided");
            return res.status(400).json({
                success: false,
                message: "Invalid refresh token",
            });
        }
        logger.info("Refresh token deleted for logout");

        res.json({
            success: true,
            message: "Logged out successfully!",
        });
    } catch (e) {
        logger.error("Error while logging out", e);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

module.exports = { resgiterUser, loginUser, refreshTokenUser, logoutUser }