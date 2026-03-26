const redis = require('redis');

const client = redis.createClient({
    host: "localhost",
    port: 6379
})

client.on("error", (error) =>
    console.log("Redis client error occured!", error)
);
// 1-sangam
// 2-1
// 3-null
// 4-101
// 5-100
// 6-95
async function testRedisConnection() {
    try {
        await client.connect();
        console.log("Connected to redis");

        await client.set("name", "sangam");

        const extractValue = await client.get("name");

        console.log("1", extractValue);

        const deleteCount = await client.del("name");
        console.log("2", deleteCount);

        const extractUpdatedValue = await client.get("name");
        console.log("3", extractUpdatedValue);

        await client.set("count", "100");
        const incrementCount = await client.incr("count");
        console.log("4", incrementCount);

        const decrementCount = await client.decr("count");
        console.log("5", decrementCount);
        await client.decr("count");
        await client.decr("count");
        await client.decr("count");
        await client.decr("count");
        await client.decr("count");
        console.log("6", await client.get("count"));
    } catch (error) {
        console.error(error);
    } finally {
        await client.quit();
    }
}

testRedisConnection();