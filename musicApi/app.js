const fs = require('fs')
const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const request = require('./util/request')
const package = require('./package.json')
const exec = require('child_process').exec
const cache = require('apicache').middleware

// version check
const {save,find,update} = require('./util/connect')
const app = express()

// CORS
app.use((req, res, next) => {
    if(req.path !== '/' && !req.path.includes('.')){
        res.header({
            'Access-Control-Allow-Credentials': true,
            'Access-Control-Allow-Origin': req.headers.origin || '*',
            'Access-Control-Allow-Headers': 'X-Requested-With',
            'Access-Control-Allow-Methods': 'PUT,POST,GET,DELETE,OPTIONS',
            'Content-Type': 'application/json; charset=utf-8'
        })
    }
    next()
})

app.use(express.json());// 可以把请求过来的参数转换成json格式
app.use(express.urlencoded({ extended: false })); // 将req上的url转换

// 处理登陆
app.post('/api/songs/login', async (req, res) => {
    // console.log(req.body)
    let result = await find({"userName":req.body.userName})
    // console.log(result)
    
    if(result === '无查询数据'){
        res.json({
            code: 1001,
            status: 'notFind',
            data: '无查询数据'
        })
    }else if(req.body.password !== result[0].password){
        res.json({
            code: 1002,
            status: 'ok',
            data: '密码错误'
        })
    }else if(result){
        res.json({
            code: 200,
            status: 'ok',
            data: result[0]
        })
    }else{
        res.json({
            code: 1000,
            status: 'noOk',
            data: result
        }) 
    }

    // next()
})
// 处理注册
app.post('/api/songs/regist', async (req, res) => {
    console.log(req.body)
    let findResult = await find({"userName":req.body.userName})
    if(findResult === '无查询数据'){
        let result = await save(req.body)
        res.json({
            code: 200,
            status: 'ok',
            data: result
        })
    }else{
        res.json({
            code: 2001,
            status: 'fail',
            data: '用户已存在'
        })
    }
    // next()
})

// 处理修改歌单数据
app.post('/api/songs/updata', async (req, res,next) => {
    // console.log(req.body)
    update(req.body)
    res.json({
        code: 200,
        status: 'ok',
        data: req.body
    })
    
    next()
})



// cookie parser
app.use((req, res, next) => {
    req.cookies = {}, (req.headers.cookie || '').split(/\s*;\s*/).forEach(pair => {
        let crack = pair.indexOf('=')
        if(crack < 1 || crack == pair.length - 1) return
        req.cookies[decodeURIComponent(pair.slice(0, crack)).trim()] = decodeURIComponent(pair.slice(crack + 1)).trim()
    })
    next()
})

// body parser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

// cache
app.use(cache('2 minutes', ((req, res) => res.statusCode === 200)))

// static
app.use(express.static(path.join(__dirname, 'public')))

// router
const special = {
    'daily_signin.js': '/daily_signin',
    'fm_trash.js': '/fm_trash',
    'personal_fm.js': '/personal_fm'
}

fs.readdirSync(path.join(__dirname, 'module')).reverse().forEach(file => {
    if(!(/\.js$/i.test(file))) return
    let route = (file in special) ? special[file] : '/' + file.replace(/\.js$/i, '').replace(/_/g, '/')
    let question = require(path.join(__dirname, 'module', file))
    
    app.use(route, (req, res) => {
        let query = Object.assign({}, req.query, req.body, {cookie: req.cookies})
        question(query, request)
        .then(answer => {
            console.log('[OK]', decodeURIComponent(req.originalUrl))
            res.append('Set-Cookie', answer.cookie)
            res.status(answer.status).send(answer.body)
        })
        .catch(answer => {
            console.log('[ERR]', decodeURIComponent(req.originalUrl))
            if(answer.body.code =='301') answer.body.msg = '需要登录'
            res.append('Set-Cookie', answer.cookie)
            res.status(answer.status).send(answer.body)
        })
    })
})

const port = process.env.PORT || 3000

app.server = app.listen(port, () => {
    console.log(`server running @ http://localhost:${port}`)
})

module.exports = app
