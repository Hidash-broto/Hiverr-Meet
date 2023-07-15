let messagesContainer = document.getElementById('messages');
messagesContainer.scrollTop = messagesContainer.scrollHeight;

const memberContainer = document.getElementById('members__container');
const memberButton = document.getElementById('members__button');

const chatContainer = document.getElementById('messages__container');
const chatButton = document.getElementById('chat__button');

let activeMemberContainer = false;

memberButton.addEventListener('click', () => {
  if (activeMemberContainer) {
    memberContainer.style.display = 'none';
  } else {
    memberContainer.style.display = 'block';
  }

  activeMemberContainer = !activeMemberContainer;
});

let activeChatContainer = false;

chatButton.addEventListener('click', () => {
  if (activeChatContainer) {
    chatContainer.style.display = 'none';
  } else {
    chatContainer.style.display = 'block';
  }

  activeChatContainer = !activeChatContainer;
});

let displayFrame = document.getElementById('stream__box')
let frameToLarge = document.getElementsByClassName('video__container')
let userIdInDisplayFrame = null;

let expandVideoFrame = (e) => {
  let child = displayFrame.children[0]
  if(child) {
    document.getElementById('streams__container').appendChild(child)
  }

  displayFrame.style.display = 'block'
  displayFrame.appendChild(e.currentTarget)
  userIdInDisplayFrame = e.currentTarget.id.replace(/\D/g, "");
  
  for (let i = 0; i < frameToLarge.length; i++) {
    if(frameToLarge[i].id.replace(/\D/g, "") !== userIdInDisplayFrame) {
      frameToLarge[i].style.height = '100px'
      frameToLarge[i].style.width = '100px'
    }
  }
}

for (let i = 0; i < frameToLarge.length; i++) {
  frameToLarge[i].addEventListener('click', expandVideoFrame)
}