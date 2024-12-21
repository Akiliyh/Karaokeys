import { resultsManager } from "./resultsManager.js";
import { init } from "./script.js";

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

    const initSong = async () => {
        console.log("Starting initialization...");

        // Forcer la récupération des données avant de continuer
        try {
            await init(); // Assurez-vous que les données sont prêtes
            console.log("Data initialized successfully.");
        } catch (error) {
            console.error("Failed to initialize data:", error);
            return; // Arrêter ici si la récupération des données échoue
        }

        const artists = resultsManager.getResults();
        console.log("Artists data:", artists);

        if (!artists || artists.length === 0) {
            console.error("No artist data found.");
            return;
        }

        const pageName = window.location.pathname.split("/").pop();
        const match = pageName.match(/song-(\d+)\.html/);

        if (!match || !match[1]) {
            console.error("No valid song index found in the URL.");
            return;
        }

        const index = parseInt(match[1]) - 1;
        const singleArtist = artists[index];

        if (!singleArtist || !singleArtist.lyrics) {
            console.error("Lyrics data missing for the selected song.");
            return;
        }

        initTimeline(singleArtist.lyrics.syncedLyrics);
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
                const parsedTime = parseTimeInput(playbackInput.value);
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

        const startTime = performance.now();
        const totalInitialHundredths = (minute * 60 * 100) + (second * 100) + hundredth;

        return setInterval(() => {
            const elapsedTimeInHundredths = Math.floor((performance.now() - startTime) / 10) + totalInitialHundredths;

            minute = Math.floor(elapsedTimeInHundredths / (60 * 100));
            second = Math.floor((elapsedTimeInHundredths % (60 * 100)) / 100);
            hundredth = elapsedTimeInHundredths % 100;

            playbackInput.value = formatTime(minute, second);
            timeline.value = elapsedTimeInHundredths;

            highlightCurrentLyric(elapsedTimeInHundredths);

            if (elapsedTimeInHundredths >= songDataArray.duration * 100) {
                clearInterval(timerInterval);
                console.log("Song ended.");
                if (onEndCallback) onEndCallback();
                return;
            }
        }, 10);
    }

    function setSecondsToMinutes(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

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

    initSong();
});
