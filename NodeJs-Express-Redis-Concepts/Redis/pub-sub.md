# Redis 的两个“大招”：**发布/订阅模式（Pub/Sub）** 和 **事务/管道（Transactions & Pipelining）**

---

## Redis 高级特性：发布订阅与事务管道

```javascript
const redis = require("redis");

const client = redis.createClient({
  host: "localhost",
  port: 6379,
});

client.on("error", (error) =>
  console.log("Redis client error occured!", error)
);

async function testAdditionalFeatures() {
  try {
    await client.connect();

    // ---------------------------------------------------------
    // 1. Pub/Sub (发布/订阅模式)
    // 场景：实时聊天室、通知推送、系统间的异步解耦
    // ---------------------------------------------------------

    // .duplicate(): 复制一个客户端。因为订阅者会进入“阻塞”状态监听消息，
    // 需要一个专门的连接来负责订阅，不能执行其他 set/get 命令。
    const subscriber = client.duplicate(); 
    await subscriber.connect(); 

    // .subscribe(): 订阅一个名为 "dummy-channel" 的频道
    await subscriber.subscribe("dummy-channel", (message, channel) => {
      console.log(`收到来自频道 ${channel} 的消息: ${message}`);
    });

    // .publish(): 向频道发布消息。所有订阅了该频道的客户端都会收到。
    await client.publish("dummy-channel", "来自发布者的第一条测试数据");
    await client.publish("dummy-channel", "来自发布者的第二条测试数据");

    // 等待 3 秒观察消息接收
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // .unsubscribe(): 取消订阅
    await subscriber.unsubscribe("dummy-channel");
    await subscriber.quit(); // 关闭订阅者专用的连接

    // ---------------------------------------------------------
    // 2. Transactions & Pipelining (事务与管道)
    // 场景：银行转账（原子性）、大量数据导入（高性能）
    // ---------------------------------------------------------

    // .multi(): 开启一个事务队列。之后的所有操作不会立刻执行，而是先“入队”。
    const multi = client.multi();

    multi.set("key-transaction1", "value1");
    multi.set("key-transaction2", "value2");
    multi.get("key-transaction1");

    // .exec(): 正式执行队列中的所有命令。
    // 如果是事务：保证这些命令要么全部成功，要么全部失败，且执行期间不会被其他请求插队。
    const results = await multi.exec();
    console.log("事务执行结果:", results);

    // 示例：银行转账 (原子性操作)
    // 只有执行了 .exec()，钱才会真正从 A 减掉并加到 B，中间不会被打断。
    const bankTransfer = client.multi();
    bankTransfer.decrBy('account:A:balance', 100);
    bankTransfer.incrBy('account:B:balance', 100);
    await bankTransfer.exec();

    // ---------------------------------------------------------
    // 3. 性能测试：普通循环 vs 管道 (Pipelining)
    // ---------------------------------------------------------
    
    console.log("开始性能测试...");

    // 情况 A：不使用管道（每个命令都要等待网络往返时间 RTT）
    console.time("without pipelining");
    for (let i = 0; i < 1000; i++) {
      // 这里的 await 会导致：发一个 -> 等结果 -> 发下一个 (效率极低)
      await client.set(`user${i}`, `user_value${i}`);
    }
    console.timeEnd("without pipelining");

    // 情况 B：使用管道（一次性把 1000 个命令打包发给 Redis）
    console.time("with pipelining");
    const bigPipeline = client.multi(); // multi 在这里起到打包作用
    for (let i = 0; i < 1000; i++) {
      // 只是把命令放进本地队列，不等待网络返回
      bigPipeline.set(`user_pipeline_key${i}`, `user_pipeline_value${i}`);
    }
    // 1000 个命令一次性发送
    await bigPipeline.exec();
    console.timeEnd("with pipelining");

  } catch (e) {
    console.error(e);
  } finally {
    client.quit();
  }
}

testAdditionalFeatures();
```

---

## 关键点解析

### 1. 为什么“管道”快这么多？

* **普通循环：** 你在家里（Node.js）给超市（Redis）打电话买 1000 个苹果。每买一个都要打一次电话、等对方拿货、挂电话，再打下一个。大部分时间花在了“打电话”和“挂电话”的往返路上。
* **管道 (Pipelining)：** 你写了一个清单（`multi` 队列），一次性发邮件过去。超市一次性配好货给你送过来。**网络往返从 1000 次变成了 1 次。**

### 2. 事务 (Multi/Exec) 的意义

在 Redis 中，`multi` 之后的所有命令会打包执行。在 Node-Redis 库中，`multi` 同时起到了“事务”和“管道”的作用。

* **事务性：** 保证了一组操作的连贯性。
* **性能优化：** 极大地减少了网络开销。

#### 3. 为什么 Pub/Sub 需要 `duplicate()`？

Redis 的连接是有状态的。一旦一个连接执行了 `SUBSCRIBE`（订阅），它就变成了“只听模式”，无法再发送 `SET` 或 `GET`。所以你必须克隆一个新的连接来负责监听。

---
