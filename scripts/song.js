window.addEventListener("DOMContentLoaded", () => {

    async function getSongsData(artists) {
        const results = [];

        for (const { artistName, song } of artists) {
            const deezerData = await getDeezerSongData(artistName, song);
            const test = await getSongBpm(deezerData.id);
            const lyricsUrl = await getLyricsLrclib(song, artistName, deezerData.album, deezerData.duration);
            const albumCover = deezerData.albumCover;
            const duration = deezerData.duration;
            const bpm = test.bpm;
            const difficulty = getDifficulty(lyricsUrl.wordCount, deezerData.duration);
            console.log(results);

            let songLinkData;


            try {
                console.log("deezer", deezerData)

                const songLinkResponse = await fetch(
                    `https://api.song.link/v1-alpha.1/links?url=deezer.com/track/${deezerData.id}`
                );
                songLinkData = await songLinkResponse.json();

                console.log("songLink", songLinkData)

            } catch (error) {
                console.error("Erreur API YouTube :", error);
            }

            results.push({
                idKara: generateRandomId(6),
                artistName,
                song,
                url: songLinkData.linksByPlatform.youtube.url,
                lyrics: lyricsUrl,
                albumCover: albumCover,
                duration: duration,
                difficulty: difficulty,
                bpm: bpm
            });
        }

        console.log(results)

        return results;
    }

    function generateRandomId(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            result += characters[randomIndex];
        }
        return result;
    }

    async function getDeezerSongData(artist, song) {
        const query = encodeURIComponent(`${artist} ${song}`);
        const url = `https://deezerdevs-deezer.p.rapidapi.com/search?q=${query}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "X-RapidAPI-Key": "9d4bc223f5msh92ff1af645e6681p1a043bjsnf41a2a1029ed",
                "X-RapidAPI-Host": "deezerdevs-deezer.p.rapidapi.com"
            }
        });

        const data = await response.json();

        if (data && data.data && data.data.length > 0) {
            const songData = data.data[0];
            return {
                album: songData.album.title,
                duration: songData.duration,
                albumCover: songData.album.cover_medium,
                id: songData.id
            };
        }

        throw new Error("Aucune donnée trouvée pour la chanson.");
    }

    async function getLyricsLrclib(song, artist, album, duration) {
        const query = new URLSearchParams({
            artist_name: artist,
            track_name: song,
            album_name: album,
            duration: duration.toString()
        });

        try {
            const response = await fetch(`https://lrclib.net/api/get?${query.toString()}`);
            const data = await response.json();

            if (data) {
                const lyricsData = {
                    plainLyrics: data.plainLyrics || "No plain lyrics found.",
                    syncedLyrics: data.syncedLyrics || "No synced lyrics found.",
                    wordCount: data.plainLyrics === "No plain lyrics found" ? 0 : data.plainLyrics.split(/\s+/).filter(word => word.trim().length > 0).length,
                };

                return lyricsData;
            }

            return {
                plainLyrics: "No plain lyrics found.",
                syncedLyrics: "No synced lyrics found.",
                wordCount: "No words found"
            };
        } catch (error) {
            console.error("Erreur lors de la récupération des paroles :", error);
            return {
                plainLyrics: "No plain lyrics found.",
                syncedLyrics: "No synced lyrics found.",
                wordCount: "No words found"
            };
        }
    }

    async function getSongBpm(deezerId) {
        const url = `https://deezerdevs-deezer.p.rapidapi.com/track/${deezerId}`;
        const options = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': 'f507eef2f3msh3819d09ed0f7144p146249jsndccd8323abac',
                'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com'
            }
        };

        try {
            const response = await fetch(url, options);
            const data = await response.json();

            return {
                bpm: data.bpm
            };

        } catch (error) {
            console.error(error);
        }
    }

    function getDifficulty(wordCount, duration) {
        let difficulty = Math.round((wordCount / duration) * 2); // word per second + arbitrary factor for better diversity
        if (difficulty < 1) difficulty = 1; // clamping
        if (difficulty > 5) difficulty = 5;
        return difficulty;
    }

    function renderLyricsWithTimecodes(lyrics) {
        const syncedLyrics = lyrics.syncedLyrics; // Synced lyrics from the API
    
        const lines = syncedLyrics.split("\n"); // split lines
    
        const lyricsContainer = document.createElement("div");
        lyricsContainer.classList.add("lyrics");
    
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
    
        document.body.appendChild(lyricsContainer);
    }   

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

        const playerDiv = document.createElement("div");
        playerDiv.id = "player";
        detailsContainer.appendChild(playerDiv);

        // Si une URL YouTube existe, on charge le lecteur
        if (songData.url) {
            const script = document.createElement("script");
            script.src = "https://www.youtube.com/iframe_api";
            script.onload = () => {
                new YT.Player("player", {
                    height: "315",
                    width: "560",
                    videoId: songData.url.split("v=")[1],
                    events: {
                        onReady: (event) => event.target.playVideo(),
                    },
                });
            };
            detailsContainer.appendChild(script);
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

    function fetchSongs() { // Fetch the json songs file
        return fetch('../../data/songs.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error("That ain't working man");
                }
                return response.json();
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });
    }

    function highlightCurrentLyric(currentTime) {
        // Get all lyric spans
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
        const artists = await fetchSongs();

        const pageName = window.location.pathname.split("/").pop(); // Get the current page name
        const match = pageName.match(/song-(\d+)\.html/); // Match 'song-<number>.html'

        const index = parseInt(match[1]) - 1;
        const singleArtist = artists[index];
        const songDataArray = await getSongsData([singleArtist]);
        initTimeline(songDataArray[0])
        renderSongDetails(songDataArray[0]);
        renderLyricsWithTimecodes(songDataArray[0].lyrics)
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