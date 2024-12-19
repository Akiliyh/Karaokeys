import { resultsManager } from "./resultsManager.js";

window.addEventListener("DOMContentLoaded", () => {

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

    const init = async () => {
        const artists = resultsManager.getResults();

        console.log(artists)

        const pageName = window.location.pathname.split("/").pop(); // Get the current page name
        const match = pageName.match(/song-(\d+)\.html/); // Match 'song-<number>.html'

        const index = parseInt(match[1]) - 1;
        const singleArtist = artists[index];
        initTimeline(singleArtist.lyrics.syncedLyrics)
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

    init();
});