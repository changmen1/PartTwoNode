const redis = require("redis");

const client = redis.createClient({
    host: "localhost",
    port: 6379,
});

//event listener

client.on("error", (error) =>
    console.log("Redis client error occured!", error)
);

async function redisDataStructures() {
    try {
        await client.connect();
        // ---------------------------------------------------------
        // 1. Strings (字符串) -> 最基础的 Key-Value
        // 场景：缓存用户信息、Session、计数器
        // ---------------------------------------------------------

        // // set: 设置一个键值对
        // await client.set("user:name", "Sangam Mukherjee");
        // // get: 获取指定键的值
        // const name = await client.get("user:name");
        // console.log(name);

        // // mSet (Multiple Set): 批量设置多个键值对（效率更高，减少网络往返）
        // await client.mSet([
        //     "user:email", "sangam@gmail.com",
        //     "user:age", "60",
        //     "user:country", "India",
        // ]);
        // // mGet: 批量获取多个键的值
        // const [email, age, country] = await client.mGet([
        //     "user:email",
        //     "user:age",
        //     "user:country",
        // ]);
        // console.log(email, age, country);

        // ---------------------------------------------------------
        // 2. Lists (列表) -> 有序、可重复的字符串队列
        // 场景：消息队列、最新动态列表、简单的任务队列
        // ---------------------------------------------------------

        // // lPush (Left Push): 从左侧（头部）插入数据
        // await client.lPush("notes", ["note1", "note2", "note3"])
        // // lRange: 获取指定范围内的元素 (0 是开始，-1 表示最后一个，即获取全部)
        // const extractAllNotes = await client.lRange("notes", 0, -1)
        // console.log(extractAllNotes);
        // // lPop (Left Pop): 移除并返回列表最左侧的第一个元素
        // const firstNote = await client.lPop("notes");
        // console.log(firstNote)

        // ---------------------------------------------------------
        // 3. Sets (集合) -> 无序、唯一的字符串集合
        // 场景：去重、抽奖系统、共同好友、标签(Tag)
        // ---------------------------------------------------------

        // // sAdd: 向集合添加元素（自动去重）
        // await client.sAdd("user:nickName", ["john", "varun", "xyz"]);
        // // sMembers: 获取集合中的所有成员
        // const extractUserNicknames = await client.sMembers("user:nickName");
        // console.log(extractUserNicknames);

        // // sIsMember: 判断某个元素是否在集合中（返回布尔值）
        // const isVarunIsOneOfUserNickName = await client.sIsMember(
        //     "user:nickName",
        //     "varun"
        // );
        // console.log(isVarunIsOneOfUserNickName);

        // // sRem (Remove): 从集合中删除指定元素
        // await client.sRem("user:nickName", "xyz");

        // ---------------------------------------------------------
        // 4. Sorted Sets (有序集合) -> 每个元素关联一个分数(score)，按分数排序
        // 场景：排行榜、带权重的任务调度、范围查询
        // ---------------------------------------------------------

        // // zAdd: 添加成员并指定分数
        // await client.zAdd("cart", [
        //     { score: 100, value: "Cart 1" },
        //     { score: 150, value: "Cart 2" },
        //     { score: 10, value: "Cart 3" },
        // ]);

        // // zRange: 获取指定排名范围内的成员（默认按分数从低到高）
        // const getCartItems = await client.zRange("cart", 0, -1);
        // console.log(getCartItems);

        // // zRangeWithScores: 获取成员的同时连带获取它们的分数
        // const extractAllCartItemsWithScore = await client.zRangeWithScores("cart", 0, -1);
        // console.log(extractAllCartItemsWithScore);

        // // zRank: 获取成员在有序集合中的排名（从 0 开始计数）
        // const cartTwoRank = await client.zRank("cart", "Cart 2");
        // console.log(cartTwoRank);

        // ---------------------------------------------------------
        // 5. Hashes (哈希/散列) -> 类似 JS 对象，适合存储对象信息
        // 场景：存储复杂的对象（如商品详情、用户信息），比 Strings 节省空间
        // ---------------------------------------------------------

        // hSet: 为哈希表设置字段
        await client.hSet("product:1", {
            name: "Product 1",
            description: "product one description",
            rating: "5",
        });

        // hGet: 获取哈希表中特定字段的值
        const getProductRating = await client.hGet("product:1", "rating");
        console.log(getProductRating);

        // hGetAll: 获取哈希表中所有的字段和值
        const getProductDetails = await client.hGetAll("product:1");
        console.log(getProductDetails);

        // hDel: 删除哈希表中的指定字段
        await client.hDel("product:1", "rating");

    } catch (e) {
        console.error(e);
    } finally {
        client.quit();
    }
}

redisDataStructures();