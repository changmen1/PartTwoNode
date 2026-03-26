const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const RefreshToken = require("../modules/RefreshToken");

const generateTokens = async (user) => {
  // 1. 生成 Access Token (包含用户 ID 和名字，存活 60 分钟)
  const accessToken = jwt.sign(
    { userId: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "60m" }
  );

  // 2. 生成一个 40 字节的随机十六进制字符串作为刷新令牌
  const refreshToken = crypto.randomBytes(40).toString("hex");

  // 3. 计算过期时间（当前时间 + 7 天）
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // 4. 重要！将刷新令牌存入数据库
  // 以后用户拿这个字符串来换新(Token)时，我们会去数据库查这个 token 是否存在且没过期
  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    expiresAt,
  });

  return { accessToken, refreshToken };
};

module.exports = generateTokens;
