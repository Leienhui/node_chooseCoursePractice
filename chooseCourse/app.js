const express = require('express');
const { query } = require('./model/connect');
const formidable = require('formidable');
const xlsx = require('node-xlsx');
const fs = require('fs');
const app = express();
const body = require('body-parser');
const url = require('url');
// sha256的加密
const crypto = require('crypto');
// session第三方包
const session = require('express-session');
const { userInfo } = require('os');
// session的设置
app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    // cookie: { secure: true }
}))

app.use(express.static('./statics'))
app.use('/uploads', (req, res) => {
    const form = formidable({ multiples: true, uploadDir: './uploads', keepExtensions: true });
    form.parse(req, (err, fields, files) => {
        let filename = files.file.path.slice(8);
        // Parse a buffer
        let data = xlsx.parse(fs.readFileSync(`./uploads/${filename}`));
        let dataArr = data[0].data;
        query('DELETE FROM ke', function (error, results, fields) {
            if (error) throw error;
        })
        for (var i = 1; i < dataArr.length; i++) {
            let courseInfo = {
                mingzi: dataArr[i][0],
                jianjie: dataArr[i][1],
                laoshi: dataArr[i][2],
                nianjixianzhi: dataArr[i][3],
                xingqiji: dataArr[i][4],
                leixing: dataArr[i][5],
                renshuxianzhi: dataArr[i][6],
                yibaorenshu: dataArr[i][7]
            }
            query('INSERT INTO ke SET ?', courseInfo, function (error, results, fields) {
                if (error) throw error;
                console.log(results);
                console.log(fields)
            });
        }
        // const workSheetsFromFile = xlsx.parse(`${__dirname}/uploads.xlsx`);
        res.send(`导入了${dataArr.length - 1}条数据`)

    });
});

app.use('/login', (req, res) => {
    const form = formidable({});
    // const form = formidable({ multiples: true, uploadDir: './uploads', keepExtensions: true });
    form.parse(req, (err, fields, files) => {
        // fields存储的就是表单对象
        // console.log(fields);
        // sha256加密
        let hash = crypto.createHash('sha256');
        // 加密密码
        let password = hash.update(fields.password).digest('hex');
        // 查找数据库中id与密码匹配的项
        let user = `SELECT *  FROM student  WHERE id= ${Number(fields.username)} AND  password ='${password}'`;
        query(user, (err, result) => {
            if (!result || result.length == 0) {
                res.json({
                    code: 700
                })
            } else {
                // 登录成功，记录session
                req.session.login = true;
                req.session.info = result[0];
                res.send({ code: 200 })
            }
        });


    })
})
// 登录页面验证,看门的

app.use('/*', (req, res, next) => {
    if (!req.session.login) {
        // res.redirect('/login.html');
        res.status(401);
        res.send("请求未授权");
    } else {

        next();
    }
})
// 静态化文件夹，使文件夹具有路由，所有当打开网页的时候相当于已经定位到statics文件夹下了
// 例如：http://localhost:10000/css/bootstrap-grid.css
app.get('/', (req, res) => {
    if (!req.session.login) {
        res.redirect('/login.html');
    } else {
        res.redirect('/xuanke.html');
    }
})
// 渲染到页面（前端用ajax）
app.use('/course', (req, res) => {
    let sql = "SELECT  *  FROM ke";
    // 不用pool的情况需要导如db,db.query()
    query(sql, (err, result) => {
        if (err) console.log(err);
        // 将数据渲染到html的页面
        res.json(result);
    })
})


app.get('/user', (req, res) => {
    if (!req.session.login) {
        res.send({});
    } else {
        // console.log(req.session.info)
        delete req.session.info.password;
        let user = `SELECT  *  FROM student WHERE id=${req.session.info.id}`;
        query(user, (err, user) => {
            if (err) throw err;
            else {
                res.send(user[0]);
            }
        })
        // res.send(req.session.info)

    }
})

app.get('/logout', (req, res) => {
    req.session.login = false;
    req.session.info = null;
    res.redirect('/login.html')
})
app.get('/baoming', (req, res) => {
    // 查询数据库查看剩余人数
    // 得到get请求的参数，内置包已经引入,true表示得到对象形式
    let objId = url.parse(req.url, true).query;
    // 学生id
    let studentId = req.session.info.id;

    let courseId = `SELECT *  FROM ke  WHERE id=${Number(objId.id)}`;
    query(courseId, (err, result1) => {
        if (err) throw err;
        else {
            // 已报名人数
            let yibaorenshu = result1[0].yibaorenshu || 0;
            // 查询是否有余数
            if (result1[0].renshuxianzhi > yibaorenshu) {
                // 查询查询年级是否匹配
                if (req.session.info.nianji == '大一' && result1[0].nianjixianzhi.split('').includes('1')
                    || req.session.info.nianji == '大二' && result1[0].nianjixianzhi.split('').includes('2')
                    || req.session.info.nianji == '大三' && result1[0].nianjixianzhi.split('').includes('3')
                    || req.session.info.nianji == '大四' && result1[0].nianjixianzhi.split('').includes('4')) {
                    // 查询是不是已经报了同一天的课程
                    let sId = `SELECT *  FROM student  WHERE id=${Number(studentId)}`;
                    query(sId, (err, result2) => {
                        if (err) throw err;
                        else {
                            // 数据库里第一个没有数据，并且数据库第二个没有数据(没有选课)
                            // 数据库里第一个有数据，并且第二个没有数据
                            // 数据库里第一个有数据，并且第二个也有数据

                            // 数据库第一个没有数据数据，第二个有数据
                            if (result2[0].xuanke1 == '' && result2[0].xuanke2 != '') {
                                // 判断用户想选的，和第二个是不是相同
                                if (result1[0].id != result2[0].xuanke2 && result1[0].xingqiji != result2[0].xuanke2.split('&')[1]) {
                                    let updatexuanke1 = `UPDATE  student  SET  xuanke1='${result1[0].id}&${result1[0].xingqiji}'  WHERE id=${Number(studentId)}`;
                                    query(updatexuanke1, (err, result3) => {
                                        if (err) throw err;
                                        else {
                                            // return res.send(req.session.info.name + '报名成功')
                                            let updateCourse = `UPDATE  ke  SET  yibaorenshu=${result1[0].yibaorenshu + 1}, renshuxianzhi=${result1[0].renshuxianzhi - 1} WHERE id=${result1[0].id}`;
                                            query(updateCourse, (err, updateCourse) => {
                                                if (err) throw err;
                                                else {

                                                    console.log(updateCourse[0] + "的值")
                                                    console.log(updateCourse)
                                                    res.send(updateCourse);
                                                }
                                            })

                                        }
                                    })
                                }

                            }
                            // 如果选课2的id不等于选可以的
                            else if (result2[0].xuanke2 == '' && result2[0].xuanke1 != '') {
                                if (result1[0].id != result2[0].xuanke1 && result1[0].xingqiji != result2[0].xuanke1.split('&')[1]) {
                                    let updatexuanke2 = `UPDATE  student  SET  xuanke2='${result1[0].id}&${result1[0].xingqiji}'   WHERE id=${Number(studentId)}`;
                                    query(updatexuanke2, (err, result4) => {
                                        if (err) throw err;
                                        else {

                                            // return res.send(req.session.info.name + '报名成功')
                                            let updateCourse = `UPDATE  ke  SET  yibaorenshu=${result1[0].yibaorenshu + 1}, renshuxianzhi=${result1[0].renshuxianzhi - 1} WHERE id=${result1[0].id}`;
                                            query(updateCourse, (err, updateCourse) => {
                                                if (err) throw err;
                                                else {
                                                    if (updateCourse.changedRows == 1) {
                                                        res.send("更新成功");
                                                    } else {
                                                        res.send("更新不成功");

                                                    }
                                                }
                                            })

                                        }
                                    })
                                }
                            }
                            else if (result2[0].xuanke1 == '' && result2[0].xuanke2 == '') {
                                let updatexuanke3 = `UPDATE  student  SET  xuanke1='${result1[0].id}&${result1[0].xingqiji}'   WHERE id=${Number(studentId)}`;
                                query(updatexuanke3, (err, result5) => {
                                    if (err) throw err;
                                    else {
                                        let updateCourse = `UPDATE  ke  SET  yibaorenshu=${result1[0].yibaorenshu + 1}, renshuxianzhi=${result1[0].renshuxianzhi - 1} WHERE id=${result1[0].id}`;
                                        query(updateCourse, (err, updateCourse) => {
                                            if (err) throw err;
                                            else {
                                                console.log(updateCourse[0] + "的值")
                                                console.log(updateCourse)
                                                res.send(updateCourse);
                                            }
                                        })

                                        // return res.send(req.session.info.name + '报名成功')
                                    }
                                })
                            }



                            // id: 123456,
                            // name: '花花呀',
                            // nianji: '大一',
                            // xuanke1: 1,
                            // xuanke2: 2,
                            // console.log(result2);

                        }

                    })
                }
                else {
                    return res.send('年级不符合');
                }
            } else {
                return res.send('人数已满')

            }
        }

    });
})

app.listen(10000, () => {
    console.log('服务器连接成功');
});