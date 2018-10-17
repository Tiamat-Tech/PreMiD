let playback = true,
eventType,
playbackNew

var lastPlaybackState = true
setInterval(() => {
  if($('.VideoContainer div video')[0] != null && $('.VideoContainer div video')[0].paused && lastPlaybackState == true) {
    handlePlayPause()
    lastPlaybackState = false;
  }
  if($('.VideoContainer div video')[0] != null && !$('.VideoContainer div video')[0].paused && lastPlaybackState == false) {
    handlePlayPause()
    lastPlaybackState = true;
  }
}, 500)

//* Create socket connection to application
var socket = io.connect('http://localhost:3020/');

//* Log when connected
socket.on('connect', function () {
  console.log('YT Presence: %c' + chrome.i18n.getMessage('connectedConsole'), "color: green; font-weight: 700")
  if(sessionStorage['ytpconnected'] == null || sessionStorage['ytpconnected'] == 'false') {
    $('<div id="ytp-connectinfo"><img draggable="false" src="//github.com/Timeraa/YT-Presence/blob/master/icon.png?raw=true"><h1>YT Presence</h1><h2>' + chrome.i18n.getMessage("connected") + '</h2></div>').appendTo('body')
    setTimeout(() => {
      $('#ytp-connectinfo').remove()
    }, 5*1000)
    sessionStorage['ytpconnected'] = 'true'
  }
})

socket.on('disconnect', function() {
  console.log('YT Presence: %c' +  + chrome.i18n.getMessage('disconnectedConsole'), "color: red; font-weight: 700")
  sessionStorage['ytpconnected'] = 'false'
  $('<div id="ytp-connectinfo"><img draggable="false" src="//github.com/Timeraa/YT-Presence/blob/master/icon.png?raw=true"><h1>YT Presence</h1><h2>' + chrome.i18n.getMessage("disconnected") + '</h2></div>').appendTo('body')
  setTimeout(() => {
    $('#ytp-connectinfo').remove()
  }, 5*1000)
})

//* When we receive messages from the application
socket.on('mediaKeyHandler', function (data) {
  //* Check if the data is for YTM & if music is running
  //* Media control buttons
  if (musicRunning) {
    //* Switch cases for playback / Clicks corresponding buttons
    switch (data.playback) {
      case "pause":
        $('.VideoContainer div video')[0].paused ? $('.VideoContainer div video')[0].play() : $('.VideoContainer div video')[0].pause()
        updateData("playPauseVideo")
        break
      case "nextTrack":
        $('.button-nfplayerNextEpisode').click()
        //* Prevent playback from being paused again
        playback = true
        //* Send response back to application
        updateData("nextVideo")
        break
    }
  }
})


function handlePlayPause() {
  //* Toggle playback variable
  if (playback == true) playback = false; else playback = true;
  //* Send status to application
  updateData(playback ? "playing" : "paused")
}

function checkPlayChange() {
  //* Correct playback if out of sync
  if (playback == false) {
    //* Check if playbutton on page matches variable
    if ($('.ytp-play-button svg').prop("outerHTML") == playButton) {
      //* Update playback variable
      playback = true
      //* Pause song
      $('.ytp-play-button').click()
    }
  }

  //* Set musicRunning variable to true if url has /watch or music title not empty
  if (document.location.pathname.includes("/watch")) musicRunning = true; else musicRunning = false;
}

//* Start interval
window.onload = function () {
  setInterval(updateData, 1000)
}

//* Create needed variables
let urlForVideo,
  songTime,
  calcDifference = []

function updateData(playbackChange = false) {
  if (document.location.pathname.includes("/watch")) musicRunning = true; else musicRunning = false;
  urlForVideo = document.location.href
  if ($(".time-remaining__time").html() != "") {
    let data

    if (playbackChange != false) {
      var eventType = 'playBackChange'
    } else {
      var eventType = 'updateData'
    }

    var endTime
    if(musicRunning && $('.VideoContainer div video')[0] != undefined) {
      var startTime = Date.now();
        endTime = Math.floor(startTime / 1000) -
        Math.floor($('.VideoContainer div video')[0].currentTime) +
        Math.floor($('.VideoContainer div video')[0].duration);
        
      data = {
        nflix: {
          url: urlForVideo,
          seriesTitle: $('.ellipsize-text').children().html(),
          season: $($('.ellipsize-text').children().get(1)).html(),
          episodeTitle: $($('.ellipsize-text').children().get(2)).html(),
          episodeCurrentTimeSeconds: Math.floor($('.VideoContainer div video')[0].currentTime),
          episodeEndTimeSeconds: Math.floor($('.VideoContainer div video')[0].duration),
          episodeCurrentTime: startTime,
          episodeEndTime: endTime,
          playback: $('.VideoContainer div video')[0].paused ? "paused" : "playing"
        }
      }
    } else {
      data = {
        nflix: {
          playback: false
        }
      }
    }
    if (socket.connected) socket.emit(eventType, data)
  }
}