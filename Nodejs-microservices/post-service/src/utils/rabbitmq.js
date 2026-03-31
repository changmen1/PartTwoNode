const amqp = require("amqplib");
const logger = require("./logger");

// 全局变量，用于缓存连接和信道，避免重复创建资源
let connection = null;
let channel = null;

// 定义交换机名称，Topic 模式下交换机负责根据路由键分发消息
const EXCHANGE_NAME = "facebook_events";

/**
 * 连接到 RabbitMQ 服务
 */
async function connectToRabbitMQ() {
  try {
    // 建立 TCP 连接，process.env.RABBITMQ_URL 应包含协议、账号密码、IP和端口（如 amqp://guest:guest@localhost:5672）
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    // 创建信道（Channel），大部分业务操作都在信道上完成
    channel = await connection.createChannel();

    // 声明交换机
    // 类型为 'topic'，允许使用通配符进行模糊匹配
    // durable: false 表示交换机不持久化，RabbitMQ 重启后该交换机会消失
    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });

    logger.info("Connected to rabbit mq");
    return channel;
  } catch (e) {
    logger.error("Error connecting to rabbit mq", e);
  }
}

/**
 * 发布事件（生产者）
 * @param {string} routingKey - 路由键，例如 "user.login" 或 "device.ecg.data"
 * @param {object} message - 要发送的 JSON 对象
 */
async function publishEvent(routingKey, message) {
  // 如果当前没有可用信道，则尝试初始化连接
  if (!channel) {
    await connectToRabbitMQ();
  }

  // 发送消息到交换机
  // RabbitMQ 只接受 Buffer 格式的数据，所以需要序列化 JSON
  channel.publish(
    EXCHANGE_NAME,
    routingKey,
    Buffer.from(JSON.stringify(message))
  );

  logger.info(`事件已发布，路由键: ${routingKey}`);
}

module.exports = { connectToRabbitMQ, publishEvent };