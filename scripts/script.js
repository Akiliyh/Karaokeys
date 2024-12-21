import { initPopulateSongCard } from "./populateData.js";
import { resultsManager } from "./resultsManager.js";

const API_KEY = "AIzaSyCCobxwZvw-xgs62T40c9Hy_ygcBMF-VoA";

async function getSongsData(artists) {
    for (const { artistName, song } of artists) {
        const deezerData = await getDeezerSongData(artistName, song);
        const lyricsUrl = await getLyricsLrclib(song, artistName, deezerData.album, deezerData.duration);
        const albumCover = deezerData.albumCover;
        const duration = deezerData.duration;
        const difficulty = getDifficulty(lyricsUrl.wordCount, deezerData.duration);

        let songLinkData;
        try {
            const songLinkResponse = await fetch(
                `https://api.song.link/v1-alpha.1/links?url=deezer.com/track/${deezerData.id}`
            );
            songLinkData = await songLinkResponse.json();
        } catch (error) {
            console.error("Erreur API YouTube :", error);
        }

        resultsManager.addResult({
            idKara: generateRandomId(6),
            artistName,
            song,
            url: songLinkData.linksByPlatform?.youtube?.url || null,
            lyrics: lyricsUrl,
            albumCover: albumCover,
            duration: duration,
            difficulty: difficulty
        });
    }

    return resultsManager.getResults();
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

function getDifficulty(wordCount, duration) {
    let difficulty = Math.round((wordCount / duration) * 2);
    if (difficulty < 1) difficulty = 1;
    if (difficulty > 5) difficulty = 5;
    return difficulty;
}

export const init = async () => {
    try {
        const artists = await fetch('./data/songs.json').then(res => res.json());
        if (!artists || artists.length === 0) {
            console.error("Aucune donnée d'artiste trouvée.");
            return;
        }

        const songsData = await getSongsData(artists);

        await initPopulateSongCard();

        songsData.forEach((songData, index) => {
            const button = document.getElementById(`listenButton${index}`);
            if (button) {
                button.addEventListener("click", () => renderSongDetails(songData));
            }
        });

        console.log("Initialisation terminée avec succès.");
    } catch (error) {
        console.error("Erreur lors de l'initialisation :", error);
    }
};

if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", init);
} else {
    init();
}