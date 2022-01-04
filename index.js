const express = require('express')
const app = express()
const path = require('path')
const data = require('./data.json')
const axios = require('axios')
const session = require('express-session')
const flash = require('connect-flash')
const data_two = require('./institution.json')
// const data_three = require('./business.json')
const socketIO = require('socket.io')
const http = require('http')


let server, io;





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
app.use(express.json())
app.use(express.urlencoded({extended: true}))

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
    // const data = await axios.post('http://localhost:5000/admin-login', req.body)
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
    // const data_three = await axios.get('http://localhost:5000/admin-business')
    const data_three = await axios.get('https://verido-2-ihdqs.ondigitalocean.app/admin-business')
    .then(resp => resp.data.response)
    console.log(data_three)
    res.render('business', { data: data_three, username: req.session.username })

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

app.get('/institutions/:id', (req, res) => {
    const { id } = req.params;
    const d = data_two.find(element => element.id ===  id)
    const consultant = data.find(element => element.index === d.consultant_id)
    res.render('profile/institution', { data: d, username: req.session.username, consultant: consultant.enterprise_name})
})

app.get('/business/:id', async (req, res) => {
    const { id } = req.params
    const data_three = await axios.get('https://verido-2-ihdqs.ondigitalocean.app/admin-business')
    // const data_three = await axios.get('http://localhost:5000/admin-business')
    .then(resp => resp.data.response)

    const d = data_three.find(element => element._id === id)
    // const consultant = data.find(element => element.index === d.consultant_id)

    res.render('profile/business', {data: d, username: req.session.username, consultant: 'Not Available'})

})

app.get('/chat', async (req, res) => {
    const data_three = await axios.get('https://verido-2-ihdqs.ondigitalocean.app/admin-business')
    // const data_three = await axios.get('http://localhost:5000/admin-business')
    .then(resp => resp.data.response)
    res.render('chat', {consultant: data, business: data_three, institution: data_two, username: req.session.username})
})

app.get('/chat/:details/:id', async (req, res) => {
    const { details, id } = req.params;
    let chat_data;
    const data_three = await axios.get('https://verido-2-ihdqs.ondigitalocean.app/admin-business')
    // const data_three = await axios.get('http://localhost:5000/admin-business')
    .then(resp => resp.data.response)

    switch(details){
        case 'consultant':
            chat_data = data.find(element => element.id === id)
            break;
        
        case 'business':
            chat_data = data_three.find(element => element._id === id)
            break;
        
        case 'institution':
            chat_data = data_two.find(element => element.id === id)
            break;
        default:
            chat_data = data.find(element => element.id === id)
            break
    }

    res.render('user-chat', {data: chat_data, consultant: data, business: data_three, institution: data_two, username: req.session.username})
})

app.post('/verification/:id', async (req, res) => {
    const { id } = req.params;

    const data_three = await axios.get('https://verido-2-ihdqs.ondigitalocean.app/admin-business')
    // const data_three = await axios.get('http://localhost:5000/admin-business')
    .then(resp => resp.data.response)

    const user_verfication = data_three.find(element => element.id === id)
    console.log(req.body)

    const data = await axios.post(`https://verido-2-ihdqs.ondigitalocean.app/admin-verification/${id}`, {...req.body})
    // const data = await axios.post(`http://localhost:5000/admin-verification/${id}`, {...req.body})
    .then(respon => {
        return respon.data })
    .catch (e => {
        console.log(e.message)
    })
    
    res.redirect(`/business/${id}`)



})


const PORT = process.env.PORT || 8000
server = http.Server(app)
server.listen(PORT, () => console.log('Listening on port 5000'))

io = socketIO(server)

const sockets = []

const users = []

io.on('connection', function(socket){
    sockets.push(socket)
    console.log(sockets.length)
    socket.on('message.send', function(data){
        console.log(`${sockets.slice(sockets.length -1)[0].id === data.id}`)
        users.push(data.id)

        io.emit('message.sent', {
            data: data.message,
            index: users[0] === data.id ? true : false
        })
    })

})

// app.listen(PORT, () => console.log('Listening on port 5000'))