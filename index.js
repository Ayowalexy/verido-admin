if(process.env.NODE_ENV !== "production"){
    require('dotenv').config()
}
const express = require('express')
const app = express()
const path = require('path')
// const data = require('./data.json')
const axios = require('axios')
const session = require('express-session')
const flash = require('connect-flash')
const data_two = require('./institution.json')
// const data_three = require('./business.json')
const socketIO = require('socket.io')
const http = require('http')
const DateFormatter = require('./utils')
const STRIPE_LIVE_KEY = process.env.STRIPE_LIVE_KEY
const stripe = require('stripe')(STRIPE_LIVE_KEY)

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

// const data = (async () => {
//     const ele = await axios.get('http://localhost:5000/fetch-consultant')
//     const res = await ele.data.consultant 

   
//     return res
// })()



app.get('/', (req, res) => {
    res.render('login', {message: ''})

})

app.get('/recover', (req, res) => {
    res.render('recover')
})

app.get('/stripe-customers', async(req, res) => {
   
    const paymentIntents = await stripe.paymentIntents.list();
    // console.log(paymentIntents)
    res.send(paymentIntents)

})
app.get('/homepage', async (req, res) => {

    const paymentIntents = await stripe.paymentIntents.list({
        limit: 8
    });

    // const custom = await stripe.customers.list()
       
    const data_three = await axios.get('https://verido-2-ihdqs.ondigitalocean.app/admin-business')
    // const data_three = await axios.get('http://localhost:5000/admin-business')
    .then(resp => resp.data.response)

    const data = await axios.get('https://verido-2-ihdqs.ondigitalocean.app/fetch-consultant')
    // const data = await axios.get('http://localhost:5000/fetch-consultant')
    .then(resp => resp.data.consultant)

    let val = DateFormatter(data_three)
    const arr = data_three.map(data =>  {
        return {
                type: data.subscription_status.type,
                dateJoined: data.subscription_status.started}
            })

    
            // console.log(custom)
    let subs = DateFormatter(arr).map(data => data !== null)
    // let subs_2 = DateFormatter(arr)

    // console.log(subs_2, '-----')

    let totalSubs = []
    let idVerified = []
    let phoneVerified = []
    data_three.filter(data => {
        if(data.subscription_status.type === 'Subscribed'){
            totalSubs.push(data)
        } else if (data.idVerified){
            idVerified.push(data)
        } else if(data.phoneVerified){
            phoneVerified.push(data)
        }
    })

    let recent_business;
     if(data_three.length >= 5){
        // recent_business = data_three.slice()
        recent_business = data_three.slice(data_three.length - 5)
    } else {
        recent_business =  data_three
    }

    let recent_consultants;
    if(data.length >= 5){
        recent_consultants = data.slice(data.length - 5)
    } else {
        recent_consultants =  data
    }
    let recent_institution;
    if(data.length >= 5){
        recent_institution = data_two.slice(19)
    } else {
        recent_institution =  data_two.slice(19)
    }


    let total = 0;
    paymentIntents.data.map(element => {
        if(element.status === 'succeeded'){
            console.log(element.amount)
            total += element.amount
    }})



    res.render('homepage',{ consultant: data.length, 
                            institution: data_two.length, 
                            business: data_three.length, 
                            username: req.session.username, 
                            signUps: val.length,
                            subs: subs.length,
                            totalSubs: totalSubs.length,
                            idVerified: idVerified.length,
                            phoneVerified: phoneVerified.length,
                            recent_business: recent_business,
                            recent_consultants: recent_consultants,
                            paymentIntents: paymentIntents.data,
                            total: total / 100,
                            recent_institution: recent_institution,

                         })
})

app.get('/index', async (req, res) => {
// app.get('/index', (req, res) => {
    const data = await axios.get('https://verido-2-ihdqs.ondigitalocean.app/fetch-consultant')
    // const data = await axios.get('http://localhost:5000/fetch-consultant')
    .then(resp => resp.data.consultant)
    
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
    if(data){
        req.token = {
            token: data.response.token,
            username: data.response.username
        } 

        if(data.role === 'consultant'){

            req.session.current_consultant_id = data.response._id

            return res.redirect(`/dashboard-consultant/${data.response._id}`)
        } else {
            req.session.current_id = data.response._id
            return res.redirect(`/homepage`)
        }

        req.session.token = data.response.token
        req.session.username = data.response.username
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
    res.render('business', { data: data_three, username: req.session.username })

    // const data = await axios.get('http://localhost:5000/admin-business')
    // .then(res => {
    //     return res.data })
    // .catch (e => {
    //     console.log(e.message)
    // })
    

})

app.get('/consultants/:id', async (req, res) => {
    const { id } = req.params

    const data = await axios.get(`https://verido-2-ihdqs.ondigitalocean.app/fetch-consultant/${id}`)
    // const data = await axios.get(`http://localhost:5000/fetch-consultant/${id}`)
    .then(resp => resp.data.consultant)

    // const d = data.find(element => element.id === id)
    // const data_three = await axios.get('https://verido-2-ihdqs.ondigitalocean.app/admin-business')
    // .then(resp => resp.data.response)
    res.render('profile/consultant', {data: data, username: req.session.username, business: data.business})
})

app.get('/institutions/:id', async (req, res) => {
    const { id } = req.params;

    const data = await axios.get('https://verido-2-ihdqs.ondigitalocean.app/fetch-consultant')
    // const data = await axios.get('http://localhost:5000/fetch-consultant')
    .then(resp => resp.data.consultant)

    const d = data_two.find(element => element.id ===  id)

    // const consultant = data.find(element => element.index === d.consultant_id)
    const consultant = data[0]
    const data_three = await axios.get('https://verido-2-ihdqs.ondigitalocean.app/admin-business')
    .then(resp => resp.data.response)
    res.render('profile/institution', { data: d, 
                                        username: req.session.username, 
                                        consultant: consultant.enterprise_name,
                                        business: data_three.slice(5, 11)
                                    })
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

app.get('/business-page/:consultant/:id', async (req, res) => {
    const { id, consultant } = req.params;
    const data_three = await axios.get('https://verido-2-ihdqs.ondigitalocean.app/admin-business')
    // const data_three = await axios.get('http://localhost:5000/admin-business')
    .then(resp => resp.data.response)

     const data = await axios.get(`https://verido-2-ihdqs.ondigitalocean.app/fetch-consultant/${id}`)
    //  const data = await axios.get(`http://localhost:5000/fetch-consultant/${id}`)
     .then(resp => resp.data.consultant)

    const d = data_three.find(element => element._id === id)
    // const consultant = data.find(element => element.index === d.consultant_id)

    res.render('consultant/business-page', {data: d, id: consultant, username: req.session.username, consultant: 'Not Available'})

})






app.get('/chat', async (req, res) => {
    const data_three = await axios.get('https://verido-2-ihdqs.ondigitalocean.app/admin-business')
    // const data_three = await axios.get('http://localhost:5000/admin-business')
    .then(resp => resp.data.response)
    const data = await axios.get('https://verido-2-ihdqs.ondigitalocean.app/fetch-consultant')

    // const data = await axios.get('http://localhost:5000/fetch-consultant')
    .then(resp => resp.data.consultant)
    res.render('chat', {consultant: data, business: data_three,
         institution: data_two, username: req.session.username})
})

app.get('/chat/:details/:id', async (req, res) => {
    const { details, id } = req.params;
    let chat_data;
    const data_three = await axios.get('https://verido-2-ihdqs.ondigitalocean.app/admin-business')
    // const data_three = await axios.get('http://localhost:5000/admin-business')
    .then(resp => resp.data.response)

    const data = await axios.get('https://verido-2-ihdqs.ondigitalocean.app/fetch-consultant')
    // const data = await axios.get('http://localhost:5000/fetch-consultant')
    .then(resp => resp.data.consultant)

    

    switch(details){
        case 'consultant':
            chat_data = data.find(element => element._id === id)
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

    const messages = await axios.get(`https://verido-2-ihdqs.ondigitalocean.app/fetch-admin-message/${req.session.current_id}`)
    // const messages = await axios.get(`http://localhost:5000/fetch-admin-message/${req.session.current_id}`)
    .then(resp => resp.data.messges)

    let prev_messages = [];

    // if(messages.messages.length){
    //     messages.messages.map(msg => {
    //         if(msg.to === chat_data._id){
    //             prev_messages.push(msg)
    //         }
    //     }) 
    // }

    if(messages.messages.length){
        messages.messages.map(message => {
            if(message.channel === `chat-${req.session.current_id}-${chat_data._id}`){
                prev_messages.push(message)
            }
            // if(message.to === current_admin._id.toString()){
            //     prev_messages.push(message)
            // }
        })

    }

console.log(prev_messages)

    res.render('user-chat', {data: chat_data, 
        prev_messages: prev_messages,
        consultant: data, business: data_three, 
        institution: data_two, username: req.session.username, 
        admin: req.session.current_id})
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

app.get('/register', (req, res) => {
    res.render('register')
})

app.post('/register', async( req, res) => {
    const data = await axios.post(`https://verido-2-ihdqs.ondigitalocean.app/new-consultant`, {...req.body})
    // const data = await axios.post(`http://localhost:5000/new-consultant`, {...req.body})
    .then(respon => {
        return respon.data })
    .catch (e => {
        console.log(e.message)
    })

    if(data.message){
        res.redirect(`/dashboard-consultant/${data.message._id}`)
    }
})

app.get('/dashboard-consultant/:id', async (req, res) => {
    const paymentIntents = await stripe.paymentIntents.list({
        limit: 8
    });

    const { id } = req.params;
    // const custom = await stripe.customers.list()
       
    const data_three = await axios.get('https://verido-2-ihdqs.ondigitalocean.app/admin-business')
    // const data_three = await axios.get('http://localhost:5000/admin-business')
    .then(resp => resp.data.response)

    const data = await axios.get(`https://verido-2-ihdqs.ondigitalocean.app/fetch-consultant/${id}`)
    // const data = await axios.get(`http://localhost:5000/fetch-consultant/${id}`)
    .then(resp => resp.data.consultant)

    // const data_thre = data.find(element => element._id === id)

    let val = DateFormatter(data_three)
    const arr = data.business.map(data =>  {
        return {
                type: data.subscription_status.type,
                dateJoined: data.subscription_status.started}
            })

    
            // console.log(custom)
    let subs = DateFormatter(arr).map(data => data !== null)
    // let subs_2 = DateFormatter(arr)

    // console.log(subs_2, '-----')

    let totalSubs = []
    let idVerified = []
    let phoneVerified = []
    data_three.filter(data => {
        if(data.subscription_status.type === 'Subscribed'){
            totalSubs.push(data)
        } else if (data.idVerified){
            idVerified.push(data)
        } else if(data.phoneVerified){
            phoneVerified.push(data)
        }
    })

    let recent_business;
     if(data_three.length >= 5){
        // recent_business = data_three.slice()
        recent_business = data.business.slice(data.business.length - 5)
    } else {
        recent_business =  data.business
    }

    


    let total = 0;
    paymentIntents.data.map(element => {
        if(element.status === 'succeeded'){
            console.log(element.amount)
            total += element.amount
    }})


    res.render('consultant/index',{ consultant: data.length, 
                            institution: data_two.length, 
                            business: data.business.length, 
                            username: req.session.username, 
                            signUps: val.length,
                            totalSubs: totalSubs.length,
                            subs: subs.length,
                            idVerified: idVerified.length,
                            phoneVerified: phoneVerified.length,
                            recent_business: recent_business,
                            paymentIntents: paymentIntents.data,
                            total: total / 100,
                            id: data._id

                         })
})

app.get('/consultant-index/:id', async (req, res) => {

    const { id } = req.params;

     const data = await axios.get(`https://verido-2-ihdqs.ondigitalocean.app/fetch-consultant/${id}`)
    //  const data = await axios.get(`http://localhost:5000/fetch-consultant/${id}`)
     .then(resp => resp.data.consultant)
    res.render('consultant/business', {id: data._id, data: data.business, username: req.session.username })

})


app.get('/consultant-chat/:consultant/:id', async (req, res) => {

    const { id, consultant } = req.params;

    const data = await axios.get(`https://verido-2-ihdqs.ondigitalocean.app/fetch-consultant/${id}`)
    // const data = await axios.get(`http://localhost:5000/fetch-consultant/${id}`)
    .then(resp => resp.data.consultant)

    const admins = await axios.get('https://verido-2-ihdqs.ondigitalocean.app/fetch-admins')
    // const admins = await axios.get(`http://localhost:5000/fetch-admins`)
    .then(resp => resp.data.admins)

    const business = data.business.find(data => data._id === consultant);

    res.render('consultant/chat', {id: data._id, 
        data: business, username: req.session.username, business: data.business, admins: admins})


})
app.get('/admin-chat/:admin/:id', async (req, res) => {

    const { id, admin } = req.params;

    const data = await axios.get(`https://verido-2-ihdqs.ondigitalocean.app/fetch-consultant/${id}`)
    // const data = await axios.get(`http://localhost:5000/fetch-consultant/${id}`)
    .then(resp => resp.data.consultant)

    const messages = await axios.get(`https://verido-2-ihdqs.ondigitalocean.app/fetch-consultant-message/${data._id}`)
    // const messages = await axios.get(`http://localhost:5000/fetch-consultant-message/${data._id}`)
    .then(resp => resp.data.messages)



    const admins = await axios.get('https://verido-2-ihdqs.ondigitalocean.app/fetch-admins')
    // const admins = await axios.get(`http://localhost:5000/fetch-admins`)
    .then(resp => resp.data.admins)

    const current_admin = admins.find(data_admin => data_admin._id === admin)

    let prev_messages = [];

    if(messages.messages.length){
        messages.messages.map(message => {
            if(message.channel === `chat-${current_admin._id.toString()}-${data._id}`){
                prev_messages.push(message)
            }
            // if(message.to === current_admin._id.toString()){
            //     prev_messages.push(message)
            // }
        })

    }

    console.log(current_admin._id, messages)

    res.render('consultant/admin-chat', {id: data._id,
        prev_messages: prev_messages,
        admin: admin,
         business: data.business, consultant: req.session.current_consultant_id,
        data: current_admin, username: req.session.username, admins: admins})


})
app.get('/consultant-chat-page/:id', async (req, res) => {

    const { id } = req.params;


    const data = await axios.get(`https://verido-2-ihdqs.ondigitalocean.app/fetch-consultant/${id}`)
    // const data = await axios.get(`http://localhost:5000/fetch-consultant/${id}`)
    .then(resp => resp.data.consultant)

   const admins = await axios.get('https://verido-2-ihdqs.ondigitalocean.app/fetch-admins')
//    const admins = await axios.get(`http://localhost:5000/fetch-admins`)
   .then(resp => resp.data.admins)

   console.log(admins)

    res.render('consultant/chat-index', {id:data._id,
         username: req.session.username, business: data.business, admins: admins})


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