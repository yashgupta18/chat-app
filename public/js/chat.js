const socket= io()

//Elements
const $messageForm = document.querySelector('#message-form') 
const $messageFormInput = $messageForm.querySelector('input') 
const $messageFormButton = $messageForm.querySelector('button') 
const $sendLocationButton = document.querySelector('#send-location') 
const $messages = document.querySelector('#messages') 


//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML 
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML 
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML 

//Options // Query search library used
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix : true}) 

//autosroll fn
const autoscroll = () =>{
    //New message
    const $newMessage = $messages.lastElementChild

    //height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin=parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    // console.log(newMessageStyles)

    //visible height
    const visibleHeight= $messages.offsetHeight

    //height of message container
    const containerHeight = $messages.scrollHeight

    //How far i scrolled
    const scrollOffset=$messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message)=>{
    //message is an object containig text and  createdAt
    // console.log(message)

    //render template using mustache library
    const html=Mustache.render(messageTemplate,{
        username:message.username,
        message:message.text,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

//listen location and print the location
socket.on('locationMessage', (message)=>{
    // console.log(message);

    const html=Mustache.render(locationMessageTemplate,{
        username:message.username,
        url:message.url,
        createdAt:moment(message.createdAt).format('h:mm a')
     })
     $messages.insertAdjacentHTML('beforeend', html)
     autoscroll();
})

//render sidebar data
socket.on('roomData', ({ room, users})=>{
    const html= Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})
$messageForm.addEventListener('submit', (e)=>{
    e.preventDefault();

    $messageFormButton.setAttribute('disabled', 'disabled')
    //disable
    const message=e.target.elements.message.value
    
    socket.emit('sendmessage',message, (error)=>{
        //enable
        $messageFormButton.removeAttribute('disabled')
        //clear the input box for new message
        $messageFormInput.value = ''
        $messageFormInput.focus()
        //if foul language was used server would throw an error
        if(error){
            return console.log(error)
        }
        //else deliver the message
        console.log('Delivered')
    })
})


$sendLocationButton.addEventListener('click', ()=>{
    if(!navigator.geolocation){
        return alert('Geolocation not supported by your browser')
    }
    //disable button till location is shared
    $sendLocationButton.setAttribute('disabled', 'disabled')
    
    navigator.geolocation.getCurrentPosition((position)=>{
        // console.log(position.coords.latitude)

        socket.emit('sendlocation', {
            latitude:position.coords.latitude,
            longitude:position.coords.longitude
        },()=>{
            //for acknowledgement
            console.log('Location shared')
            //re enable location button
            $sendLocationButton.removeAttribute('disabled')
        })
        
        
    })
})


socket.emit('join', {username, room}, (error)=>{
    if(error){
        alert(error)
        location.href='/'
    }
})




