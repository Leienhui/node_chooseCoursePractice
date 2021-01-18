// 引入mysql的第三方包
const mysql = require('mysql');
// 连接数据库
// const db = mysql.createConnection({
//     host: "localhost",
//     user: "root",
//     password: "root",
//     port: "3306",
//     database: "xkxtdb"
// });
// db.connect((err) => {
//     if (err) throw err;
//     console.log('连接成功');
// })
var pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
    database: 'xkxtdb'
});

var query = function (sql, options, callback) {

    pool.getConnection(function (err, conn) {
        if (err) {
            // callback(err, null, null);
            throw err;
        } else {
            conn.query(sql, options, function (err, results, fields) {
                //事件驱动回调
                callback(err, results, fields);
                console.log("连接成功");
            });
            //释放连接，需要注意的是连接释放需要在此处释放，而不是在查询回调里面释放
            conn.release();
        }
    });
};
module.exports = {
    query
    // db
}
