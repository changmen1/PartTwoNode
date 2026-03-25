//对象 -> 处理二进制数据
//文件系统操作、密码学、图像处理

const buffOne = Buffer.alloc(10); //分配一个 10 字节的缓冲区 -> 全部为零
console.log(buffOne);

const buffFromString = Buffer.from("Hello");
console.log(buffFromString);

const buffFromArrayOfintegers = Buffer.from([1, 2, 3, 4, 5, 0]);
console.log(buffFromArrayOfintegers);

buffOne.write("Sangam");
console.log("After writing Node js to buffOne", buffOne.toString());

console.log(buffFromString[0]);

console.log(buffFromString.slice(0, 3));

const concatBuffs = Buffer.concat([buffOne, buffFromString]);
console.log(concatBuffs);

console.log(concatBuffs.toJSON());
