import { resultsManager } from "./resultsManager.js";
import { init } from "./script.js";

    function renderSongDetails(songData) {

        const detailsContainer = document.createElement("div");
        detailsContainer.id = "song-details";

        const artistSpan = document.querySelector(".artist");
        artistSpan.textContent = songData.artistName;

        const songSpan = document.querySelector(".song");
        songSpan.textContent = songData.song;

        // const lyricSyncedSpan = document.createElement("span");
        // lyricSyncedSpan.textContent = `Synced Lyrics: ${songData.lyrics.syncedLyrics}`;
        // detailsContainer.appendChild(lyricSyncedSpan);

        // const lyricWordsSpan = document.createElement("span");
        // lyricWordsSpan.textContent = `Words: ${songData.lyrics.wordCount}`;
        // detailsContainer.appendChild(lyricWordsSpan);

        const songDifficultySpan = document.createElement("span");
        songDifficultySpan.textContent = `Difficulty: ${songData.difficulty}`;
        detailsContainer.appendChild(songDifficultySpan);

        const YTPlayer = document.getElementById('player');

        // Si une URL YouTube existe, on charge le lecteur
        if (songData.url) {
            var tag = document.createElement('script');

      tag.src = "https://www.youtube.com/iframe_api";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      // 3. This function creates an <iframe> (and YouTube player)
      //    after the API code downloads.
      var player;
      console.log(songData.url.split("v=")[1]);
      window.onYouTubeIframeAPIReady = () => {
        player = new YT.Player('player', {
          height: '360',
          width: '640',
          videoId: songData.url.split("v=")[1],
          events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
          }
        });
      }

      function onPlayerReady(event) {
        event.target.playVideo();
      }

      var done = false;
      function onPlayerStateChange(event) {
        if (event.data == YT.PlayerState.PLAYING && !done) {
          setTimeout(stopVideo, 6000);
          done = true;
        }
      }
      function stopVideo() {
        player.stopVideo();
      }
        }

        if (songData.albumCover) {
            const albumCover = document.querySelector('.album');
            albumCover.src = songData.albumCover;
            albumCover.alt = `Album cover for ${songData.song}`;
            albumCover.style.width = "200px";
            albumCover.style.height = "200px";
        }

        document.body.appendChild(detailsContainer);
    }

    function renderLyricsWithTimecodes(lyrics) {
        const syncedLyrics = lyrics.syncedLyrics; // Synced lyrics from the API
    
        const lines = syncedLyrics.split("\n"); // split lines
    
        const lyricsContainer = document.querySelector(".lyrics");

        // We create a span for each synced lyric
        lines.forEach(line => {
            const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)/); // Match time and text
            if (match) {
                const minute = parseInt(match[1]);
                const second = parseInt(match[2]);
                const hundredth = parseInt(match[3]);
                const text = match[4].trim();
    
                // in order to compare we want everything in hundredths
                const timeInHundredths = (minute * 60 * 100) + (second * 100) + hundredth;
    
                const span = document.createElement("span");
                span.textContent = text;
                span.dataset.time = timeInHundredths; // and we store the data in the data for comparison
                lyricsContainer.appendChild(span);
            }
        });
    
    } 

    function highlightCurrentLyric(currentTime) {
        const lyricSpans = document.querySelectorAll(".lyrics span");
    
        lyricSpans.forEach((span) => {
            const spanTime = parseInt(span.dataset.time, 10);
    
            if (currentTime >= spanTime) {
                lyricSpans.forEach(s => s.classList.remove("active"));
    
                span.classList.add("active");
    
            }
        });
    }

    const initSongs = async () => {
        init();
        const artists = resultsManager.getResults();

        console.log(artists);
        console.log(resultsManager.getResults());

        const pageName = window.location.pathname.split("/").pop(); // Get the current page name
        const match = pageName.match(/song-(\d+)\.html/); // Match 'song-<number>.html'

        const index = parseInt(match[1]) - 1;
        const singleArtist = artists[index];
        console.log(singleArtist);
        initTimeline(singleArtist);
        renderLyricsWithTimecodes(singleArtist.lyrics);
        renderSongDetails(singleArtist);
    };

    function initTimeline(songDataArray) {
        const playButton = document.querySelector(".play");
        const restartButton = document.querySelector(".restart");
        const pauseButton = document.querySelector(".pause");
        const timeline = document.getElementById("timeline");
        const playbackInput = document.getElementById("playback");
        const durationInput = document.getElementById("duration");

        let timerInterval = null;
        let hundredth = 0;
        let second = 0;
        let minute = 0;

        playbackInput.value = "00:00";
        timeline.max = songDataArray.duration * 100; // Duration in hundredths of a second
        timeline.value = 0;
        durationInput.value = setSecondsToMinutes(songDataArray.duration);

        playButton.addEventListener("click", () => {
            if (!timerInterval) {
                const parsedTime = parseTimeInput(playbackInput.value);  // retrieve values from the input and set them to timer state
                minute = parsedTime.minute;
                second = parsedTime.second;
                hundredth = 0; 

                timerInterval = startTimer(
                    songDataArray,
                    timeline,
                    { minute, second, hundredth },
                    playbackInput
                );
            }
        });

        pauseButton.addEventListener("click", () => {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
        });

        restartButton.addEventListener("click", () => {
            ({ minute, second, hundredth } = restartTimer(timeline, playbackInput));
            clearInterval(timerInterval);
            timerInterval = null;
        });
    }

    function restartTimer(timeline, playbackInput) {
        let hundredth = 0;
        let second = 0;
        let minute = 0;
        timeline.value = 0;
        playbackInput.value = "00:00";

        return { minute, second, hundredth };
    }

    function startTimer(songDataArray, timeline, time, playbackInput, onEndCallback) {
        let { minute, second, hundredth } = time;
    
        const startTime = performance.now(); // Record the starting time in milliseconds
        const totalInitialHundredths = (minute * 60 * 100) + (second * 100) + hundredth;
    
        return setInterval(() => {
            const elapsedTimeInHundredths = Math.floor((performance.now() - startTime) / 10) + totalInitialHundredths;
    
            minute = Math.floor(elapsedTimeInHundredths / (60 * 100));
            second = Math.floor((elapsedTimeInHundredths % (60 * 100)) / 100);
            hundredth = elapsedTimeInHundredths % 100;
    
            playbackInput.value = formatTime(minute, second); // update timeline value and input
            timeline.value = elapsedTimeInHundredths;
    
            highlightCurrentLyric(elapsedTimeInHundredths);
    
            if (elapsedTimeInHundredths >= songDataArray.duration * 100) {   // stop when song ends
                clearInterval(timerInterval);
                console.log("Song ended.");
                if (onEndCallback) onEndCallback();
                return;
            }
    
            // console.log(`Minute: ${returnData(minute)}, Second: ${returnData(second)}, Hundredth: ${returnData(hundredth)}`);
        }, 10); // every 10ms
    }
    

    function setSecondsToMinutes(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        // Format the duration as MM:SS
        const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        return formattedTime;
    }

    function formatTime(minute, second) {
        return `${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}`;
    }

    function parseTimeInput(timeString) {
        const [minute, second] = timeString.split(":").map((val) => parseInt(val, 10));
        return { minute: isNaN(minute) ? 0 : minute, second: isNaN(second) ? 0 : second };
    }

    await initSongs();