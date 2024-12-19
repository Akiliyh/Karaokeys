let favorites = [];

export const getFavorites = () => {
    return favorites;
};

export const setNewFavory = (id) => {
    if (!favorites.includes(id)) {
        favorites.push(id);
        updateFavoriteButton(id, true);
        console.log("new favory",favorites);
    }
};

export const deleteFavory = (id) => {
    favorites = favorites.filter(favId => favId !== id);
    updateFavoriteButton(id, false);
    console.log("delete favory",favorites);
};

export const updateFavoriteButton = (id, isFavorited) => {
    const button = document.querySelector(`.favoryButton[data-id="${id}"]`);
    if (button) {
        button.classList.toggle("notLiked", !isFavorited);
        button.classList.toggle("liked", isFavorited);
        const icon = button.querySelector("img");
        button.style.backgroundColor = isFavorited ? "#C4F209" : "";
        icon.src = isFavorited ? "./images/svg/heartFilled.svg" : "./images/svg/heartStroke.svg";
        icon.alt = isFavorited ? "Remove from favorites" : "Add to favorites";
    }
};