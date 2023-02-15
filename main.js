import './style.css'
import AgoraRTC from "agora-rtc-sdk-ng"

const appid = "33e8d887b5c84942a8b07b2e514a9fba"
const token = null
const rtcUid =  Math.floor(Math.random() * 2032)

let roomId = "main"

let audioTracks = {
  localAudioTrack: null,
  remoteAudioTracks: {},
};

let rtcClient;


const initRtc = async () => {
  rtcClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  
  await rtcClient.join(appid, roomId, token, rtcUid)

  audioTracks.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  await rtcClient.publish(audioTracks.localAudioTrack);

  document.getElementById('members').insertAdjacentHTML('beforeend', `<div class="speaker user-rtc-${rtcUid}" id="${rtcUid}"><p>${rtcUid}</p></div>`)
}

let lobbyForm = document.getElementById('form')

const enterRoom = async (e) => {
  e.preventDefault()
  initRtc()

  lobbyForm.style.display = 'none'
  document.getElementById('room-header').style.display = "flex"
}

lobbyForm.addEventListener('submit', enterRoom)