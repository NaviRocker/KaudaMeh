import './style.css'
import AgoraRTC from "agora-rtc-sdk-ng"
import AgoraRTM from 'agora-rtm-sdk'

const appid = "33e8d887b5c84942a8b07b2e514a9fba"
const token = null
const rtcUid =  Math.floor(Math.random() * 2032)
const rtmUid =  String(Math.floor(Math.random() * 2032))


let roomId = "main"

let audioTracks = {
  localAudioTrack: null,
  remoteAudioTracks: {},
};

let rtcClient;
let rtmClient;
let channel;

let micMuted = true

let initRtm = async (name) => {
  rtmClient = AgoraRTM.createInstance(appid)
  await rtmClient.login({'uid':rtmUid, 'token':token})

  channel = rtmClient.createChannel(roomId)
  await channel.join()

  getChannelMembers()

  channel.on('MemberJoined', handleMemberJoined)
  channel.on('MemberLeft', handleMemberLeft)

  window.addEventListener('beforeunload', leaveRtmChannel)

}


const initRtc = async () => {
  rtcClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  rtcClient.on('user-published', handleUserPublished)
  rtcClient.on('user-left', handleUserLeft)

  await rtcClient.join(appid, roomId, token, rtcUid)

  audioTracks.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  audioTracks.localAudioTrack.setMuted(micMuted)
  await rtcClient.publish(audioTracks.localAudioTrack);

  // initVolumeIndicator()
}

let initVolumeIndicator = async () => {

  AgoraRTC.setParameter('AUDIO_VOLUME_INDICATION_INTERVAL', 200);
  rtcClient.enableAudioVolumeIndicator();
  
  rtcClient.on("volume-indicator", volumes => {
    volumes.forEach((volume) => {
      console.log(`UID ${volume.uid} Level ${volume.level}`);

      try{
          let item = document.getElementsByClassName(`user-rtc-${volume.uid}`)[0]

         if (volume.level >= 50){
           item.style.borderColor = '#00ff00'
         }else{
           item.style.borderColor = "#fff"
         }
      }catch(error){
        console.error(error)
      }

    });
  })
}

let handleUserPublished = async (user, mediaType) => {
  await rtcClient.subscribe(user, mediaType)

  if(mediaType == 'audio'){
    audioTracks.remoteAudioTracks[user.uid] = [user.audioTrack]
    user.audioTrack.play()
  }
}

let handleUserLeft = async (user) => {
  delete audioTracks.remoteAudioTracks[user.uid]
  // document.getElementById(user.uid).remove()
}

let handleMemberJoined = async (MemberId) => {
  let userWrapper = `<div class="speaker user-rtc-${'---'}" id="${MemberId}"><p>${MemberId}</p></div>`

  document.getElementById('members').insertAdjacentHTML('beforeend', userWrapper)

}

let handleMemberLeft = async (MemberId) => {
  document.getElementById(MemberId).remove()

}

let getChannelMembers = async () => {
  let members = await channel.getMembers()

  for(let i=0; members.length > i; i++){
    let userWrapper = `<div class="speaker user-rtc-${'---'}" id="${members[i]}"><p>${members[i]}</p></div>`
    document.getElementById('members').insertAdjacentHTML('beforeend', userWrapper)


  }
}

let toggleMic = async (e) => {
  if(micMuted){
    e.target.src = 'icons/mic.svg'
    e.target.style.backgroundColor = 'ivory'
    micMuted = false
  } else {
    e.target.src = 'icons/mic-off.svg'
    e.target.style.backgroundColor = 'indianred'
    micMuted = true
  }
  audioTracks.localAudioTrack.setMuted(micMuted)
}


let lobbyForm = document.getElementById('form')

const enterRoom = async (e) => {
  e.preventDefault()

  let displayName = ''

  initRtc() 
  initRtm(displayName)

  lobbyForm.style.display = 'none'
  document.getElementById('room-header').style.display = "flex"
}

let leaveRtmChannel = async () => {
  await channel.leave()
  await rtcClient.logout()

}

let leaveRoom = async () => {
  audioTracks.localAudioTrack.stop()
  audioTracks.localAudioTrack.close()

  rtcClient.unpublish()
  rtcClient.leave()

  leaveRtmChannel()

  document.getElementById('form').style.display = 'block'
  document.getElementById('room-header').style.display = 'none'
  document.getElementById('members').innerHTML = ''

}

lobbyForm.addEventListener('submit', enterRoom)
document.getElementById('leave-icon').addEventListener('click', leaveRoom)
document.getElementById('mic-icon').addEventListener('click', toggleMic)

