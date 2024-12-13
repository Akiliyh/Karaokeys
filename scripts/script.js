window.addEventListener("DOMContentLoaded", () => {
    const API_KEY = "AIzaSyCCobxwZvw-xgs62T40c9Hy_ygcBMF-VoA";

    async function getSongsData(artists) {
        const results = [];

        for (const { artistName, song } of artists) {
            let videoId = null;
            try {
                const youtubeResponse = await fetch(
                    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(artistName)}%20${encodeURIComponent(song)}&key=${API_KEY}&type=video&maxResults=1`
                );
                const youtubeData = await youtubeResponse.json();

                if (youtubeData.items && youtubeData.items.length > 0) {
                    videoId = youtubeData.items[0].id.videoId;
                }
            } catch (error) {
                console.error("Erreur API YouTube :", error);
            }

            const deezerData = await getDeezerSongData(artistName, song);
            const lyricsUrl = await getLyricsLrclib(song, artistName, deezerData.album, deezerData.duration);
            const albumCover = deezerData.albumCover;

            console.log(results);

            results.push({
                artistName,
                song,
                url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : null,  // Si YouTube échoue, pas d'URL vidéo
                lyrics: lyricsUrl,
                albumCover: albumCover,
            });
        }

        return results;
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
                albumCover: songData.album.cover_medium
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
                    syncedLyrics: data.syncedLyrics || "No synced lyrics found."
                };

                return lyricsData;
            }

            return {
                plainLyrics: "No plain lyrics found.",
                syncedLyrics: "No synced lyrics found."
            };
        } catch (error) {
            console.error("Erreur lors de la récupération des paroles :", error);
            return {
                plainLyrics: "No plain lyrics found.",
                syncedLyrics: "No synced lyrics found."
            };
        }
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

    const artists = [
        { artistName: "Stromae", song: "Papaoutai" },
        { artistName: "Stromae", song: "Formidable" },
        { artistName: "Gims", song: "Où aller" },
    ];

    getSongsData(artists).then((songDataArray) => {
        songDataArray.forEach((songData, index) => {
            const button = document.getElementById(`song${index}`);
            button.textContent = `${songData.artistName} - ${songData.song}`;
            button.addEventListener("click", () => renderSongDetails(songData));
        });
    });
});