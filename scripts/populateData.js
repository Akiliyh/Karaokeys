import { deleteFavory, setNewFavory, getFavorites } from "./favorites.js";
import { resultsManager } from "./resultsManager.js";

const populateSongCard = (results) => {
    const songsContainer = document.querySelector(".songs");
    songsContainer.innerHTML = "";

    results.forEach(song => {
        const songDiv = document.createElement("div");
        songDiv.className = `songContainer song${song.idKara}`;

        const starsHTML = Array(song.difficulty)
            .fill(`<img src="./images/svg/star.svg" alt="Star" class="starIcon"/>`)
            .join("");

        songDiv.innerHTML = `
            <div class="leftPart">
                <img class="songImage" src="${song.albumCover}" alt="Album cover of ${song.song}" />
                <div class="infos">
                    <div class="headerInfos">
                        <span class="songTitle">${song.song}</span>
                        <span class="songArtist">${song.artistName}</span>
                    </div>
                    <div class="statsInfos">
                        <div class="difficulty">
                            <span>Difficulty</span>
                            <div class="stars">${starsHTML}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="rightPart">
                <button class="button favoryButton notLiked" data-id="${song.idKara}">
                    <img src="./images/svg/heartStroke.svg" alt="Add to favorites" />
                </button>
                <button class="button listenButton">
                    <img src="./images/svg/player.svg" alt="Listen to song" />
                </button>
            </div>
        `;

        songsContainer.appendChild(songDiv);

        const favoryButton = songDiv.querySelector(".favoryButton");
        favoryButton.addEventListener("click", () => {
            const id = favoryButton.dataset.id;
            if (getFavorites().includes(id)) {
                deleteFavory(id);
            } else {
                setNewFavory(id);
            }
        });
    });
};

export const initPopulateSongCard = async () => {
    try {
        const results = resultsManager.getResults();
        populateSongCard(results);
    } catch (error) {
        console.error("Erreur lors de l'initialisation :", error);
    }
};