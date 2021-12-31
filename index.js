const express = require('express')
const app = express()
const path = require('path')
const data = require('./data.json')
const axios = require('axios')
const session = require('express-session')
const flash = require('connect-flash')
const data_two = require('./institution.json')


app.use(express.json())
app.use(express.urlencoded({extended: true}))

const sessionConfig = {
    secret: 'thisshouldbeabettersecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expire: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig))
app.use(flash())
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(path.join(__dirname, 'default')))

const isLoggedIn = (req, res, next) => {

    console.log(req.session.token)
    if(req.session.token){
        next()
    } else {
        console.log('Not logged in')
        res.redirect('/')
    }
}

app.get('/', (req, res) => {
    res.render('login', {message: ''})
})

app.get('/recover', (req, res) => {
    res.render('recover')
})

app.get('/index', (req, res) => {
// app.get('/index', (req, res) => {
    res.render('index', { data: data, username: req.session.username })
})

app.post('/login', async( req, res) => {
    const { password, email } = req.body
    const data = await axios.post('https://verido-2-ihdqs.ondigitalocean.app/admin-login', req.body)
            .then(res => {
                return res.data })
            .catch (e => {
                console.log(e.message)
            })
    console.log(data)
    if(data.code){
        req.token = {
            token: data.response.token,
            username: data.response.username
        }

        req.session.token = data.response.token
        req.session.username = data.response.username
        return res.redirect('/index')
    } else {
        res.render('login', {message: "Username or Password is incorrect"})
    }
})


app.post('/recover', async(req, res) => {
    const data = await axios.post('https://verido-2-ihdqs.ondigitalocean.app/admin-reset-password', req.body).then(res => res.data)
    
})

app.get('/institution', (req, res) => {
    res.render('institution', {data: data_two, username: req.session.username})
})

app.get('/business-owners', async(req, res) => {
    res.render('business', { data: data, username: req.session.username })

    // const data = await axios.get('http://localhost:5000/admin-business')
    // .then(res => {
    //     return res.data })
    // .catch (e => {
    //     console.log(e.message)
    // })
    

})

app.get('/consultants/:id', (req, res) => {
    const { id } = req.params
    const d = data.find(element => element.id === id)
    res.render('profile/consultant', {data: d, username: req.session.username})
})

app.get('/institution/:id', (req, res) => {
    const { id } = req.params;
    const d = data_two.find(element => element.id ===  id)
    res.render('profile/institution', { data: d, username: req.session.username})
})

app.get('/business/:id', (req, res) => {
    const { id } = req.params
    const d = data.find(element => element.id === id)
    res.render('profile/business', {data: d, username: req.session.username})

})

const PORT = process.env.PORT || 8000

app.listen(PORT, () => console.log('Listening on port 5000'))
