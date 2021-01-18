const crypto = require('crypto');
const formidable = require('formidable');
// session第三方包
const session = require('express-session');
// session的设置
app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    // cookie: { secure: true }
}))

module.exports = (req, res) => {
    const form = formidable({});
    // const form = formidable({ multiples: true, uploadDir: './uploads', keepExtensions: true });
    form.parse(req, (err, fields, files) => {
        // fields存储的就是表单对象
        console.log(fields);
        // sha256加密
        let hash = crypto.createHash('sha256');
        // 加密密码
        let password = hash.update(fields.password).digest('hex');
        // 查找数据库中id与密码匹配的项
        let user = `SELECT *  FROM student  WHERE id= ${Number(fields.username)} AND  password ='${password}'`;
        query(user, (err, result) => {
            console.log(result);
            if (!result || result.length == 0) {
                res.json({
                    code: 700
                })
            } else {
                // 登录成功，记录session
                req.session.login = true;
                res.json({
                    code: 200,
                })
            }
        });


    })
}