let handleMemberJoin = async (memberId) => {
    console.log('new Member Joined')
    addMemberToDom(memberId)
    let members = await channel.getMembers()
    membersCount(members)
    let {name} = await rtmClient.getUserAttributesByKeys(memberId, ['name'])
    addBotMessageToDom(`Welcome to the room ${name}! 👋`)
}

let addMemberToDom = async (memberId) => {
    let {name} = await rtmClient.getUserAttributesByKeys(memberId, ['name'])
    let membersWrapper = document.getElementById('member__list')


    let memberItem = `<div class="member__wrapper" id="member__${memberId}__wrapper">
                            <span class="green__icon"></span>
                            <p class="member_name">${name}</p>
                        </div>`
    membersWrapper.insertAdjacentHTML('beforeend', memberItem)
}

let handleMemberLeft = async (memberId) => {
    removeMemberFromDom(memberId)
    let members = await channel.getMembers()
    membersCount(members)
}

let removeMemberFromDom = (memberId) => {
    let element = document.getElementById(`member__${memberId}__wrapper`)
    let name = element.getElementsByClassName('member_name')[0].textContent;
    addBotMessageToDom(`${name} has left the room`)
    element.remove()
}

let allMembers = async () => {
    let members = await channel.getMembers()
    membersCount(members)
    for (let i = 0; i < members.length; i++) {
        addMemberToDom(members[i])
    }
}

let handleChannelMessage = async (messageData, memberId) => {
    console.log('message Received')
    let data = JSON.parse(messageData.text);
    if(data.type === 'chat') {
        addMessageToDom(data.message, data.displayName)
    }

    if(data.type === 'user_left') {
        document.getElementById(`user-container-${data.uid}`).remove()
    }
    let lastMessage = document.querySelector('#messages .message__wrapper:last-child')
    lastMessage?.scrollIntoView()
}

let sendMessage = (e) => {
    e.preventDefault()

    let message = e.target.message.value
    channel.sendMessage({text: JSON.stringify({'type': 'chat', 'message': message, 'displayName': displayName})})
    addMessageToDom(message, displayName)
    let lastMessage = document.querySelector('#messages .message__wrapper:last-child')
    lastMessage?.scrollIntoView()

    e.target.reset()
}

let addMessageToDom = (message, name) => {
    let messageWrapper = document.getElementById('messages')

    let Message = `<div class="message__wrapper">
                        <div class="message__body">
                            <strong class="message__author">${name}</strong>
                            <p class="message__text">${message}</p>
                        </div>
                    </div>`
    messageWrapper.insertAdjacentHTML('beforeend', Message)
}

let addBotMessageToDom = (message) => {
    let messageWrapper = document.getElementById('messages')

    let Message = `<div class="message__wrapper">
                    <div class="message__body__bot">
                        <strong class="message__author__bot">🤖 Mumble Bot</strong>
                        <p class="message__text__bot">${message}</p>
                    </div>
                </div>`
    messageWrapper.insertAdjacentHTML('beforeend', Message)
}

let membersCount = (members) => {
    let countElement = document.getElementById('members__count')
    countElement.innerHTML = members.length
}

let leaveChannel = async () => {
    await channel.leave()
    await rtmClient.logout()
}

window.addEventListener('beforeunload', leaveChannel)
let messageForm = document.getElementById('message__form').addEventListener('submit', sendMessage)