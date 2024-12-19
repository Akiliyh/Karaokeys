window.addEventListener("DOMContentLoaded", () => {

    async function getSongsData(artists) {
        const results = [];

        for (const { artistName, song } of artists) {
            const deezerData = await getDeezerSongData(artistName, song);
            const lyricsUrl = await getLyricsLrclib(song, artistName, deezerData.album, deezerData.duration);
            const albumCover = deezerData.albumCover;
            const duration = deezerData.duration;
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
                idKara : generateRandomId(6),
                artistName,
                song,
                url: songLinkData.linksByPlatform.youtube.url, 
                lyrics: lyricsUrl,
                albumCover: albumCover,
                duration: duration,
                difficulty: difficulty
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
                id : songData.id
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

    function getDifficulty(wordCount, duration) {
        let difficulty = Math.round((wordCount / duration) * 2); // word per second + arbitrary factor for better diversity
        console.log(difficulty);
        console.log( (wordCount / duration) * 2);
        if (difficulty < 1) difficulty = 1; // clamping
        if (difficulty > 5) difficulty = 5;
        return difficulty;
    }

    function renderSongDetails(songData) {
        const existingDetails = document.getElementById("song-details");
        if (existingDetails) existingDetails.remove();

        const detailsContainer = document.createElement("div");
        detailsContainer.id = "song-details";

        const artistSpan = document.createElement("span");
        artistSpan.textContent = `Artist: ${songData.artistName}`;
        detailsContainer.appendChild(artistSpan);

        const songSpan = document.createElement("span");
        songSpan.textContent = `Song: ${songData.song}`;
        detailsContainer.appendChild(songSpan);

        const lyricPlainSpan = document.createElement("span");
        lyricPlainSpan.textContent = `Plain Lyrics: ${songData.lyrics.plainLyrics}`;
        detailsContainer.appendChild(lyricPlainSpan);

        const lyricSyncedSpan = document.createElement("span");
        lyricSyncedSpan.textContent = `Synced Lyrics: ${songData.lyrics.syncedLyrics}`;
        detailsContainer.appendChild(lyricSyncedSpan);

        const lyricWordsSpan = document.createElement("span");
        lyricWordsSpan.textContent = `Words: ${songData.lyrics.wordCount}`;
        detailsContainer.appendChild(lyricWordsSpan);

        const songDurationSpan = document.createElement("span");
        songDurationSpan.textContent = `Duration: ${songData.duration}`;
        detailsContainer.appendChild(songDurationSpan);

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
            const albumCover = document.createElement("img");
            albumCover.src = songData.albumCover;
            albumCover.alt = `Album cover for ${songData.song}`;
            albumCover.style.width = "200px";
            albumCover.style.height = "200px";
            detailsContainer.appendChild(albumCover);
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

    const init = async () => {
        const artists = await fetchSongs();
        if (artists) {
            getSongsData(artists).then((songDataArray) => {
                songDataArray.forEach((songData, index) => {
                    const button = document.getElementById(`song${index}`);
                    button.textContent = `${songData.artistName} - ${songData.song}`;
                    button.addEventListener("click", () => renderSongDetails(songData));
                });
            });
        }
    };
    
    init();
});