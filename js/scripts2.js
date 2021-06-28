if(!document.fullscreenEnabled) {
    $("#fullscreen").addClass("hidden");
}

// https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', `${vh}px`);
window.addEventListener('resize', () => {
    // We execute the same script as before
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
});

// Loading the YouTube API (must be done in global scope)
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

const store = new SteinStore(
  "https://api.steinhq.com/v1/storages/60d3a04cd2a8585c5af282ce"
);

var videoIds;
var videoIndex = 0;

var gifPaths = ["gif1.gif","gif2.gif","gif3.gif","gif4.gif","gif5.gif","gif6.gif","gif7.gif","gif8.gif","gif9.gif","gif10.gif","gif11.gif","gif12.gif","gif13.gif","gif14.gif","gif15.gif"]


store.read("ids", { }).then(data => {
  videoIds = shuffle(data);

  //console.log(data[0].ids);
});

function shuffle(array) {
  var currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

var player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '390',
        width: '640',
        videoId: 'vUySIPTxtvQ',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onError
        },
        playerVars: {
            controls: 0,
            disablekb: 1,
            modestbranding: 0,
            playsinline: 1,
        }
    });
}

var isPlayerReady = false;
function onPlayerReady(event) {
    log('YouTube API loaded.');
    $('#playicon').removeClass('hidden');
    isPlayerReady = true;
}

function onError(event) {
    log("YouTube error (code " + event.data + "). Restarting...");
    findVideo();
}

var staticSfx = new Audio('public/static.mp3');
staticSfx.loop = true;

var started = false;
var firstVideoFound = false;
var censorTimeout;
function onPlayerStateChange(event) {
    if(event.data == YT.PlayerState.BUFFERING && !started) {
        player.pauseVideo();
        start();
    }
    if(event.data == YT.PlayerState.PLAYING && firstVideoFound) {
        $('#player').css('opacity', 1);
        $('#static').addClass('hidden');
        staticSfx.pause();
        $('#censor').removeClass('hidden');
        censorTimeout = setTimeout(hideCensor, 4000);
    }
    else if(event.data == YT.PlayerState.ENDED) {
        skipVideo();
        console.log('video ended... skipping');
    }
}

function start() {
    if(started) {
        return;
    }
    staticSfx.play();
    $('#static').removeClass('hidden');
    $('#overlay').removeClass('hidden');
    $('#playicon').addClass('hidden');
    $('#warning').addClass('hidden');
    started = true;
    findVideo();
}

function onCompleteAA(data) {
  //console.log(data)
    console.log("antiAlias: " + data.rawMisMatchPercentage)
    if(data.rawMisMatchPercentage < 2 || data.rawMisMatchPercentage > 20) {
      console.log("failed antialias test")
      //console.log(thumbnailUrls[1] + "\n" + thumbnailUrls[2])
      skipVideo();
    }
    else {

      // resemble(thumbnailUrls[1]).compareTo(thumbnailUrls[2]).onComplete(onCompleteStandard);
    }
}

function onCompleteStandard(data) {
    console.log("standard: " +data.rawMisMatchPercentage)
    if(data.rawMisMatchPercentage < 20) {
      console.log("failed standard test")
      //console.log(thumbnailUrls[1] + "\n" + thumbnailUrls[2])
      skipVideo();
    }
}




function findVideo() {
  //console.log(videoIds);
  var thisId = videoIds[videoIndex].ids;
  console.log("https://youtube.com/watch?v="+thisId);
  firstVideoFound = true;

  var urlBase = "https://img.youtube.com/vi/" + thisId + "/";
  var thumbnailUrls = [urlBase + "1.jpg",urlBase+"2.jpg",urlBase+"3.jpg"]

  var bottomBounds = .2;
  var topBounds = 25;

// returns a difference rate (from 0 to 1)
  //console.log("compare " + simi.compare(img1, img2));\

  resemble(thumbnailUrls[0]).compareTo(thumbnailUrls[1]).ignoreAntialiasing().onComplete(
    function (data1) {
      //console.image(thumbnailUrls[0]);
      //console.image(thumbnailUrls[2]);
      if(data1.rawMisMatchPercentage < bottomBounds || data1.rawMisMatchPercentage > topBounds) {
        console.log("failed antialias test")
        console.log("antiAlias: " + data1.rawMisMatchPercentage)
        //console.log(thumbnailUrls[1] + "\n" + thumbnailUrls[2])
        skipVideo();
      }
      else {

        resemble(thumbnailUrls[1]).compareTo(thumbnailUrls[2]).ignoreAntialiasing().onComplete(
          function (data2) {
            if(data2.rawMisMatchPercentage < bottomBounds || data2.rawMisMatchPercentage > topBounds) {
              console.log("failed antialias test")
              console.log("antiAlias: " + data2.rawMisMatchPercentage)
              //console.log(thumbnailUrls[1] + "\n" + thumbnailUrls[2])
              skipVideo();
            }
            else {

              resemble(thumbnailUrls[0]).compareTo(thumbnailUrls[2]).ignoreAntialiasing().onComplete(
                function (data3) {

                  if(data3.rawMisMatchPercentage < bottomBounds || data3.rawMisMatchPercentage > topBounds) {
                    console.log("failed antialias test")
                    console.log("antiAlias: " + data3.rawMisMatchPercentage)
                    skipVideo();
                  }
                  else {

                    // resemble(thumbnailUrls[1]).compareTo(thumbnailUrls[2]).onComplete(onCompleteStandard);
                  }
              });
            }
        });
      }
  });

  // resemble(thumbnailUrls[1]).compareTo(thumbnailUrls[2]).ignoreAntialiasing().onComplete(onCompleteAA);
  // resemble(thumbnailUrls[0]).compareTo(thumbnailUrls[2]).ignoreAntialiasing().onComplete(onCompleteAA);




  //player.loadVideoById(thisId)
  //player.seekTo(20,true)
  player.loadVideoById({
    videoId: thisId,
    startSeconds: 20,
  });

  if(videoIndex < videoIds.length-1) {
    videoIndex++;
  }
  else {
    videoIndex=0;
  }

}




function handleAjaxError(xhr) {
    log('Error! Request Status: ' + xhr.status + ' Status Text: ' + xhr.statusText + ' ResponseText: ' + xhr.responseText, true);
    findVideo();
}

function log(message, isError = false) {
    if(!isError) {
        return;
    }
    console.log(message);
    //$('#errors').append(message + '<br>');
}

$("#fullscreen").click(function(e) {
    document.body.requestFullscreen();
});

document.onfullscreenchange = function(e) {
    if(e.currentTarget.fullscreen) {
        $("#fullscreen").addClass("hidden");
    }
    else {
        $("#fullscreen").removeClass("hidden");
    }
}

$(document).on('click keypress', function(e) {
    if(e.target.id == "fullscreen" || e.target.href != undefined) {
        return;
    }
    if(!started) {
        start();
    }
    else if($('#static').hasClass("hidden")) {
        skipVideo();
        console.log('clicked... skipping');
    }
});

function skipVideo() {
    if(censorTimeout != undefined) {
        clearTimeout(censorTimeout);
        log("Cleared censorTimeout.");
    }
    staticSfx.play();
    player.pauseVideo();
    $('#static').removeClass('hidden');

    var randomGifPath = gifPaths[Math.floor(Math.random()*gifPaths.length)]
    var gifUrl = "url('./public/" + randomGifPath + "')"
    $('#static').css("background-image", gifUrl)
    $('#censor').addClass('hidden');
    findVideo();
}

function hideCensor() {
    $('#censor').addClass('hidden');
}
;
