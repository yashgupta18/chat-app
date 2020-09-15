const path=require('path')
const http=require('http')
const express=require('express')
const socketio=require('socket.io')
const Filter= require('bad-words')
const {generateMessage, generateLocationMessage}=require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} =require('./utils/users')

const app=express()
const server=http.createServer(app)
const io=socketio(server)

const port=process.env.PORT || 3000
const publicDirectoryPath=path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

//this fn runs for each connection
io.on('connection',(socket)=>{
    console.log('New Websocketconnection')
    
    //join emit
    socket.on('join', ({username, room}, callback) =>{

        //add user to array
        const {error,user}= addUser({id: socket.id, username, room})
        
        if(error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin','Welcome!'));
        
        //emits to users of room
        socket.broadcast.to(room).emit('message', generateMessage('Admin',`${user.username} has joined`))

        //show all users in a room
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })

    //listen for event from client
    socket.on('sendmessage', (message, callback)=>{
        const user=getUser(socket.id)
        //check for bad words
        const filter=new Filter()

        //if foul language return back
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('message', generateMessage(user.username,message))
        callback()
    })

    socket.on('sendlocation', (coords,callback)=>{
        const user=getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        //acknowledge back
        callback()
    })

    socket.on('disconnect', ()=>{
        const user= removeUser(socket.id)
        
        if(user){
            io.to(user.room).emit('message', generateMessage('Admin',`${user.username}  has left`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }  
    })
}) 

server.listen(port, ()=>{
    console.log(`Server is up ${port}`)
})

