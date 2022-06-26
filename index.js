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
const stripe = require('stripe')(STRIPE_LIVE_KEY);
const schedule = require('node-schedule');




let server, io;

const live = "https:// api.verido.app"

const sessionConfig = {
    secret: 'thisshouldbeabettersecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expire: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        sameSite: 'none'
    },
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
//     const ele = await axios.get('https://api.verido.app/fetch-consultant')
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
app.get('/homepage/:id', async (req, res) => {


    const { id } = req.params;
    const paymentIntents = await stripe.paymentIntents.list({
        limit: 8
    });

    // const custom = await stripe.customers.list()
       
    const data_three = await axios.get('https://api.verido.app/admin-business')
    // const data_three = await axios.get('https://api.verido.app/admin-business')
    .then(resp => resp.data.response)

    const videos = await axios.get('https://api.verido.app/vidoes')
    // const data_three = await axios.get('https://api.verido.app/admin-business')
    .then(resp => resp.data.response)


    const data = await axios.get('https://api.verido.app/fetch-consultant')
    // const data = await axios.get('https://api.verido.app/fetch-consultant')
    .then(resp => resp.data.consultant)

    let val = DateFormatter(data_three)
    const arr = data_three.map(data =>  {
        return {
                type: data.subscription_status.type,
                dateJoined: data.subscription_status.started}
            })

    
    let subs = DateFormatter(arr).map(data => data !== null)
   
    let userTrial = 0;
    let userSubs = 0;
    let expiresSub = 0;
    let subButExpired = 0;
    let trialAndActive = 0;

    data_three.map(element => {

        switch(element.subscription_status.type){
            case 'Subscribed': 
                userSubs = userSubs + 1;
                break
            case 'trial':
                userTrial = userTrial + 1;
                break
            default: 
                userSubs = userSubs + 0 ;
                userTrial =  userTrial + 0;
                break
        }

        const today = new Date().getTime()
        const expires = new Date(element.subscription_status.expires).getTime()

        if(today > expires){
            expiresSub +=1;
        }

        if((element.subscription_status.type === 'Subscribed') && (today > expires)){
            subButExpired +=1;
        }
        if((element.subscription_status.type === 'trial') && !(today > expires)){
            trialAndActive +=1;
        }

        

    })



    // console.log(userSubs)
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


    res.render('homepage',{userSubs: userSubs, 
                            userTrial : userTrial, 
                            expiresSub: expiresSub, 
                            subButExpired: subButExpired, 
                            trialAndActive: trialAndActive,
                            consultant: data.length, 
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
                            admin_id: id,
                            videos: videos

                         })
})

app.post('/video/:id', async(req, res) => {
    const { id } = req.params;
    
    const data = await axios.post(`https://api.verido.app/vidoes`, {...req.body})
    .then(respon => {
        return respon.data.response })
    .catch (e => {
        console.log(e.message)
    })

    res.redirect(`/homepage/${id}`)
})
app.post('/delete-video/:videoID/:id', async(req, res) => {
    const { id, videoID } = req.params;
    
    const data = await axios.post(`https://api.verido.app/delete-video/${videoID}`, {...req.body})
    .then(respon => {
        return respon.data.response })
    .catch (e => {
        console.log(e.message)
    })

    res.redirect(`/homepage/${id}`)
})

app.get('/index/:id', async (req, res) => {
    const { id } = req.params;
// app.get('/index', (req, res) => {
    const data = await axios.get('https://api.verido.app/fetch-consultant')
    // const data = await axios.get('https://api.verido.app/fetch-consultant')
    .then(resp => resp.data.consultant)
    
    res.render('index', { data: data, admin_id: id, username: req.session.username })
})

app.post('/login', async( req, res) => {
    const { password, email } = req.body
    const data = await axios.post('https://api.verido.app/admin-login', req.body)
    // const data = await axios.post('https://api.verido.app/admin-login', req.body)
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
            return res.redirect(`/homepage/${data.response._id}`)
        }

        req.session.token = data.response.token
        req.session.username = data.response.username
    } else {
        res.render('login', {message: "Username or Password is incorrect"})
    }
})

app.get('/edit-video/:videoID/:adminID', async(req, res) => {
    const data = await axios.post(`https://api.verido.app/edit-vidoes/${req.params.videoID}`)
    console.log(data)
    if(data.status == 200){
        res.redirect(`/homepage/${req.params.adminID}`)
    }
})


app.post('/recover', async(req, res) => {
    const data = await axios.post('https://api.verido.app/admin-reset-password', req.body).then(res => res.data)
    
})

app.get('/institution/:id', (req, res) => {
    const { id } = req.params;
    res.render('institution', {data: data_two,admin_id: id, username: req.session.username})
})

app.get('/business-owners/:id', async(req, res) => {
    const { id } = req.params;
    // const data_three = await axios.get('https://api.verido.app/admin-business')
    const data_three = await axios.get('https://api.verido.app/admin-business')
    .then(resp => resp.data.response)
    res.render('business', { data: data_three, admin_id: id, username: req.session.username })

    // const data = await axios.get('https://api.verido.app/admin-business')
    // .then(res => {
    //     return res.data })
    // .catch (e => {
    //     console.log(e.message)
    // })
    

})
app.post('/create-busniness/:id', async(req, res) => {
    const business = await axios.post(`https://api.verido.app/register`, {...req.body});
    if(business.status === 200){
        res.redirect(`/business-owners/${req.params.id}`)
    }
    console.log(business.data)

})

app.get('/consultants/:admin/:id', async (req, res) => {
    const { id, admin } = req.params

    const data = await axios.get(`https://api.verido.app/fetch-consultant/${id}`)
    // const data = await axios.get(`https://api.verido.app/fetch-consultant/${id}`)
    .then(resp => resp.data.consultant)

    // const d = data.find(element => element.id === id)
    // const data_three = await axios.get('https://api.verido.app/admin-business')
    // .then(resp => resp.data.response)
    res.render('profile/consultant', {data: data,
        admin_id: admin,
         username: req.session.username, business: data.business})
})

app.get('/institutions/:admin/:id', async (req, res) => {
    const { id, admin } = req.params;

    const data = await axios.get('https://api.verido.app/fetch-consultant')
    // const data = await axios.get('https://api.verido.app/fetch-consultant')
    .then(resp => resp.data.consultant)

    const d = data_two.find(element => element.id ===  id)

    // const consultant = data.find(element => element.index === d.consultant_id)
    const consultant = data[0]
    const data_three = await axios.get('https://api.verido.app/admin-business')
    .then(resp => resp.data.response)
    res.render('profile/institution', { data: d, 
                                        admin_id: admin,
                                        username: req.session.username, 
                                        consultant: consultant.enterprise_name,
                                        business: data_three.slice(5, 11)
                                    })
})

app.get('/business/:admin/:id', async (req, res) => {
    const { id, admin } = req.params
    const data_three = await axios.get('https://api.verido.app/admin-business')
    // const data_three = await axios.get('https://api.verido.app/admin-business')
    .then(resp => resp.data.response)

    const d = data_three.find(element => element._id === id)
    // const consultant = data.find(element => element.index === d.consultant_id)

    const allConsultants = await axios.get('https://api.verido.app/fetch-consultant')
    // const data_three = await axios.get('https://api.verido.app/admin-business')
    .then(resp => resp.data.consultant)


    console.log('All data', d)
    res.render('profile/business', {data: d,
        admin_id: admin,
        business_id: id,
        allConsultants,
        username: req.session.username, consultant: 'Not Available'})

})

app.post('/update/:admin/:id', async(req, res) => {
    console.log(req.body)
    const data = await axios.post(`https://api.verido.app/update-business/${req.params.id}`, {...req.body})
    if(data.status == 200){
        res.redirect(`/business/${req.params.admin}/${req.params.id}`)
    }

})

app.post('/suspend/:admin_id/:business_id/:type', async(req, res) => {

    if(req.params.type.trim() === 'suspend-user'){
        console.log("processing")
        const data = await axios.get(`https://api.verido.app/suspend-user/${req.params.business_id}/suspend-user`)
        if(data.status === 200){
            res.redirect(`/business/${req.params.admin_id}/${req.params.business_id}`)
        }
    } else {
        const data = await axios.get(`https://api.verido.app/suspend-user/${req.params.business_id}/activate`)
        if(data.status === 200){
            res.redirect(`/business/${req.params.admin_id}/${req.params.business_id}`)
        }
    }
    
})

app.get('/business-page/:consultant/:id', async (req, res) => {
    const { id, consultant } = req.params;
    const data_three = await axios.get('https://api.verido.app/admin-business')
    // const data_three = await axios.get('https://api.verido.app/admin-business')
    .then(resp => resp.data.response)

     const data = await axios.get(`https://api.verido.app/fetch-consultant/${id}`)
    //  const data = await axios.get(`https://api.verido.app/fetch-consultant/${id}`)
     .then(resp => resp.data.consultant)

    const d = data_three.find(element => element._id === id)
    // const consultant = data.find(element => element.index === d.consultant_id)

    res.render('consultant/business-page', {data: d, id: consultant, username: req.session.username, consultant: 'Not Available'})

})






app.get('/chat/:id', async (req, res) => {

    const { id } = req.params;
    const data_three = await axios.get('https://api.verido.app/admin-business')
    // const data_three = await axios.get('https://api.verido.app/admin-business')
    .then(resp => resp.data.response)
    const data = await axios.get('https://api.verido.app/fetch-consultant')

    // const data = await axios.get('https://api.verido.app/fetch-consultant')
    .then(resp => resp.data.consultant)
    res.render('chat', {consultant: data, business: data_three,
        admin_id: id,
         institution: data_two, username: req.session.username})
})

app.get('/chat/:details/:admin/:id', async (req, res) => {
    const { details, id, admin } = req.params;
    let chat_data;
    const data_three = await axios.get('https://api.verido.app/admin-business')
    // const data_three = await axios.get('https://api.verido.app/admin-business')
    .then(resp => resp.data.response)

    const data = await axios.get('https://api.verido.app/fetch-consultant')
    // const data = await axios.get('https://api.verido.app/fetch-consultant')
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

    const messages = await axios.get(`https://api.verido.app/fetch-admin-message/${admin}`)
    // const messages = await axios.get(`https://api.verido.app/fetch-admin-message/${req.session.current_id}`)
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
            if(message.channel === `chat-${admin}-${chat_data._id}`){
                prev_messages.push(message)
            }
            // if(message.to === current_admin._id.toString()){
            //     prev_messages.push(message)
            // }
        })

    }


    res.render('user-chat', {data: chat_data, 
        prev_messages: prev_messages,
        consultant: data, business: data_three, 
        institution: data_two, username: req.session.username, 
        admin_id: admin,
        admin: admin
        // admin: req.session.current_id
    })
})

app.post('/verification/:id', async (req, res) => {
    const { id } = req.params;

    const data_three = await axios.get('https://api.verido.app/admin-business')
    // const data_three = await axios.get('https://api.verido.app/admin-business')
    .then(resp => resp.data.response)

    const user_verfication = data_three.find(element => element.id === id)
    console.log(req.body)

    const data = await axios.post(`https://api.verido.app/admin-verification/${id}`, {...req.body})
    // const data = await axios.post(`https://api.verido.app/admin-verification/${id}`, {...req.body})
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
    const data = await axios.post(`https://api.verido.app/new-consultant`, {...req.body})
    // const data = await axios.post(`https://api.verido.app/new-consultant`, {...req.body})
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
       
    const data_three = await axios.get('https://api.verido.app/admin-business')
    // const data_three = await axios.get('https://api.verido.app/admin-business')
    .then(resp => resp.data.response)

    const data = await axios.get(`https://api.verido.app/fetch-consultant/${id}`)
    // const data = await axios.get(`https://api.verido.app/fetch-consultant/${id}`)
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
                            id: data._id,
                            user: data

                         })
})

app.get('/consultant-index/:id', async (req, res) => {

    const { id } = req.params;

     const data = await axios.get(`https://api.verido.app/fetch-consultant/${id}`)
    //  const data = await axios.get(`https://api.verido.app/fetch-consultant/${id}`)
     .then(resp => resp.data.consultant)
    res.render('consultant/business', {id: data._id,
        user: data,
         data: data.business, username: req.session.username })

})


app.get('/consultant-chat/:consultant/:id', async (req, res) => {

    const { id, consultant } = req.params;

    const data = await axios.get(`https://api.verido.app/fetch-consultant/${id}`)
    // const data = await axios.get(`https://api.verido.app/fetch-consultant/${id}`)
    .then(resp => resp.data.consultant)

    const business = data.business.find(data => data._id === consultant);

    // const messages = await axios.get(`https://api.verido.app/fetch-business-messages/chat-${business._id.toString()}-${data._id}`)
    const messages = await axios.get(`https://api.verido.app/fetch-consultant-message/${data._id}`)
    // const messages = await axios.get(`https://api.verido.app/fetch-consultant-message/${data._id}`)
    .then(resp => resp.data.messages)

    const admins = await axios.get('https://api.verido.app/fetch-admins')
    // const admins = await axios.get(`https://api.verido.app/fetch-admins`)
    .then(resp => resp.data.admins)


    
    let prev_messages = [];

    if(messages.messages.length){
        messages.messages.map(message => {
            if(message.channel === `chat-${business._id.toString()}-${data._id}`){
                prev_messages.push(message)
            }
            // if(message.to === current_admin._id.toString()){
            //     prev_messages.push(message)
            // }
        })

    }

    res.render('consultant/chat', {id: data._id, 
        user: data,
        admin: consultant,
        prev_messages: prev_messages,
        data: business, username: req.session.username, business: data.business, admins: admins})


})
app.get('/admin-chat/:admin/:id', async (req, res) => {

    const { id, admin } = req.params;

    const data = await axios.get(`https://api.verido.app/fetch-consultant/${id}`)
    // const data = await axios.get(`https://api.verido.app/fetch-consultant/${id}`)
    .then(resp => resp.data.consultant)

    const messages = await axios.get(`https://api.verido.app/fetch-consultant-message/${data._id}`)
    // const messages = await axios.get(`https://api.verido.app/fetch-consultant-message/${data._id}`)
    .then(resp => resp.data.messages)



    const admins = await axios.get('https://api.verido.app/fetch-admins')
    // const admins = await axios.get(`https://api.verido.app/fetch-admins`)
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


    res.render('consultant/admin-chat', {id: data._id,
        prev_messages: prev_messages,
        admin: admin,
        user: data,
         business: data.business, consultant: req.session.current_consultant_id,
        data: current_admin, username: req.session.username, admins: admins})


})
app.get('/consultant-chat-page/:id', async (req, res) => {

    const { id } = req.params;


    const data = await axios.get(`https://api.verido.app/fetch-consultant/${id}`)
    // const data = await axios.get(`https://api.verido.app/fetch-consultant/${id}`)
    .then(resp => resp.data.consultant)

   const admins = await axios.get('https://api.verido.app/fetch-admins')
//    const admins = await axios.get(`https://api.verido.app/fetch-admins`)
   .then(resp => resp.data.admins)


    res.render('consultant/chat-index', {id:data._id,
        user: data,
         username: data.username, business: data.business, admins: admins})


})


app.post('/update_full_name/:admin/:business/:id', async(req, res) => {
    const data = await axios.post(`https://api.verido.app/update-fullname/${req.params.id}`, {...req.body} )
    if(data.status == 200){
        res.redirect(`/business/${req.params.admin}/${req.params.business}`)
    }
})



const PORT = process.env.PORT || 8000
server = http.Server(app)
server.listen(PORT, () => console.log(`Listening on port ${PORT}`))

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