const APP_ID = '03391ff0aaea41e9a32a93262e25f0ef'

let uid = sessionStorage.getItem('uid')
if (uid === NaN || uid === null) {
    const uid = String(Math.floor(Math.random() * 10000))
    sessionStorage.setItem('uid', uid)
}

let token = null;
let client;

const queryString = window.location.search
const urlParams = new URLSearchParams(queryString)
let roomId = urlParams.get('room')

let displayName = sessionStorage.getItem('display_name')

if(!displayName) {
    window.location = 'lobby.html'
}

if (!roomId) {
    roomId = 'main'
}

let localTracks = []
let remoteUser = {}
let localScreenTracks
let screenSharing = false;

let rtmClient;
let channel;

let joinRoomInit = async () => {
    console.log(uid, token)
    rtmClient = await AgoraRTM.createInstance(APP_ID)
    await rtmClient.login({uid, token})

    await rtmClient.addOrUpdateLocalUserAttributes({'name': displayName})

    channel = await rtmClient.createChannel(roomId)
    await channel.join()
    channel.on('MemberJoined', handleMemberJoin)
    channel.on('MemberLeft', handleMemberLeft)
    channel.on('ChannelMessage', handleChannelMessage)
    allMembers()
    addBotMessageToDom(`Welcome to the room ${displayName}! 👋`)

    client = AgoraRTC.createClient({mode: 'rtc', codec: 'vp8'})
    await client.join(APP_ID, roomId, token, uid)

    console.log(token, '89')


    client.on('user-published', handleUserPublished)
    client.on('user-left', handleUserRemove)
}

joinRoomInit()

let joinStream = async () => {
    document.getElementById('join-btn').style.display = 'none'
    document.getElementsByClassName('stream__actions')[0].style.display = 'flex'

    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks({}, {encoderConfig:{
        width: {min: 640, ideal: 1920, max: 1920},
        height: {min: 480, ideal: 1080, max: 1080}
    }})

    let player = `<div class="video__container" id="user-container-${uid}">
                       <div class="video-player" id="user-${uid}"></div>
                   </div>`
    
    document.getElementById('streams__container').insertAdjacentHTML('beforeend', player)
    document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame)
    localTracks[1].play(`user-${uid}`)
    await client.publish([localTracks[0], localTracks[1]])
}

let handleUserPublished = async (user, mediaType) => {
    remoteUser[user.uid] = user;
    await client.subscribe(user, mediaType)

    let player = document.getElementById(`user-container-${user.uid}`)

    if(player === null) {
        player = `<div class="video__container" id="user-container-${user.uid}">
                        <div class="video-player" id="user-${user.uid}"></div>
                    </div>`;
        document.getElementById('streams__container').insertAdjacentHTML('beforeend', player)
        document.getElementById(`user-container-${user.uid}`).addEventListener('click', expandVideoFrame)

    }

    if(displayFrame.style.display) {
        player.style.height = '100px';
        player.style.width = '100px';

    }

    if (mediaType === 'video') {
        user.videoTrack.play(`user-${user.uid}`)
    }

    if (mediaType === 'audio') {
        user.audioTrack.play();
    }
}

let handleUserRemove = (user) => {
    delete remoteUser[user.uid]
    document.getElementById(`user-container-${user.uid}`).remove()
    console.log(userIdInDisplayFrame, '===', user.uid, '===', frameToLarge[0].id)
    if(userIdInDisplayFrame == user.uid) {
        displayFrame.style.display = null;

        let frameToLarge = document.getElementsByClassName('video__container')
        for (let i = 0; i < frameToLarge.length; i++) {
            frameToLarge[i].style.width = '300px'
            frameToLarge[i].style.height = '300px'
        }
    }
}

let hideDisplayFrame = () => {
    userIdInDisplayFrame = null;
    displayFrame.style.display = null;

    let child = displayFrame.children[0]
    document.getElementById('streams__container').appendChild(child)
    let frameToLarge = document.getElementsByClassName('video__container')
    for (let i = 0; i < frameToLarge.length; i++) {
        frameToLarge[i].style.width = '300px'
        frameToLarge[i].style.height = '300px'
    }
}

displayFrame.addEventListener('click', hideDisplayFrame)

let toggleCamera = async (e) => {
    let button = e.currentTarget;

    if(localTracks[1].muted) {
        await localTracks[1].setMuted(false)
        button.classList.add('active')
    } else {
        await localTracks[1].setMuted(true)
        button.classList.remove('active')
    }
}
document.getElementById('camera-btn').addEventListener('click', toggleCamera)

let toggleMic = async (e) => {
    let button = e.currentTarget;
    console.log(button.classList)

    if(localTracks[0].muted) {
        await localTracks[0].setMuted(false)
        button.classList.add('active')
    } else {
        await localTracks[0].setMuted(true)
        button.classList.remove('active')
    }
}
document.getElementById('mic-btn').addEventListener('click', toggleMic)

let toggleScreen = async (e) => {
    const button = e.currentTarget;
    const cameraButton = document.getElementById('camera-btn')

    if (!screenSharing) {

        localScreenTracks = await AgoraRTC.createScreenVideoTrack()
        screenSharing = true;
        button.classList.add('active')
        cameraButton.classList.remove('active')
        cameraButton.style.display = 'none';


        document.getElementById(`user-container-${uid}`).remove();
        displayFrame.style.display = 'block';
        let player = `<div class="video__container" id="user-container-${uid}">
                           <div class="video-player" id="user-${uid}"></div>
                       </div>`;
        displayFrame.insertAdjacentHTML('beforeend', player)
        document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame)
        userIdInDisplayFrame = `user-container-${uid}`
        localScreenTracks.play(`user-${uid}`)
        
        await client.unpublish([localTracks[1]])
        await client.publish([localScreenTracks])

        let frameToLarge = document.getElementsByClassName('video__container')
        for (let i = 0; i < frameToLarge.length; i++) {
            if(frameToLarge[i].id.replace(/\D/g, "") !== userIdInDisplayFrame.replace(/\D/g, "")) {
                frameToLarge[i].style.height = '100px'
                frameToLarge[i].style.width = '100px'
              }
        }
    } else {
        screenSharing = false;
        cameraButton.style.display = 'block'
        document.getElementById(`user-container-${uid}`).remove();
        await client.unpublish([localScreenTracks])

        switchCamera();
    }
}
document.getElementById('screen-btn').addEventListener('click', toggleScreen)

let switchCamera = async () => {
    let player = `<div class="video__container" id="user-container-${uid}">
                        <div class="video-player" id="user-${uid}"></div>
                    </div>`;
    displayFrame.insertAdjacentHTML('beforeend', player)

    await localTracks[0].setMuted(true)
    await localTracks[1].setMuted(true)

    document.getElementById('camera-btn').classList.remove('active')
    document.getElementById('mic-btn').classList.remove('active')

    localTracks[1].play(`user-${uid}`)
    await client.publish([localTracks[0], localTracks[1]])

}

let leaveStream = async (e) => {
    e.preventDefault()

    document.getElementById('join-btn').style.display = 'block';
    document.getElementsByClassName('stream__actions')[0].style.display = 'none'

    for (let i = 0; i < localTracks.length; i++) {
        localTracks[i].stop();
        localTracks[i].close();
        
    }

    await client.unpublish([localTracks[0], localTracks[1]])

    if(localScreenTracks) {
        await client.unpublish([localScreenTracks])
    }

    if (userIdInDisplayFrame === uid) {
        displayFrame.style.display = null;

        for (let i = 0; i < frameToLarge.length; i++) {
            frameToLarge[i].style.width = '300px'
            frameToLarge[i].style.height = '300px'
        }
    }
    channel.sendMessage({text: JSON.stringify({'type': 'user_left', 'uid': uid})})

    document.getElementById(`user-container-${uid}`).remove()
}
document.getElementById('join-btn').addEventListener('click', joinStream)

document.getElementById('leave-btn').addEventListener('click', leaveStream)
