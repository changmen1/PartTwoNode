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

// 刷新token

// 退出登录

module.exports = { resgiterUser }