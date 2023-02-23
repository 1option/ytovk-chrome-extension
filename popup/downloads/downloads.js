import { initializeDownloadStore } from "../../scripts/storage.js";
//TODO Вынести переиспользуемые функции в helpers

const buttonBack = document.querySelector(".button-back");
const buttonDeleteAll = document.querySelector(".button-delete-all");
const downloads = document.querySelector(".downloads");
const navButtons = document.querySelector(".nav-buttons");

buttonDeleteAll.addEventListener("click", () => {
    initializeDownloadStore();
    document
        .querySelectorAll(".track-wrapper")
        .forEach((track) => track.remove());
    showEmptyDownloadsText();
});

buttonBack.addEventListener("click", () => {
    let currentUrl = window.location.href;
    let rawPath = currentUrl.substring(0, currentUrl.indexOf("popup"));
    let pathPopup = "popup/form/form.html";
    window.location.href = rawPath + pathPopup;
    chrome.runtime.sendMessage({
        type: "setPopup",
        path: pathPopup,
    });
});

function getDownloadsFromStorage() {
    return chrome.storage.local.get(["downloads"]);
}

function showEmptyDownloadsText() {
    let emptyDownloadsTextDiv = document.createElement("div");
    emptyDownloadsTextDiv.classList.add("empty-downloads-wrapper");
    emptyDownloadsTextDiv.innerHTML =
        "<span class='empty-downloads-text'>No downloads</span>";
    downloads.appendChild(emptyDownloadsTextDiv);
}

function renderTracks() {
    getDownloadsFromStorage().then((storage) => {
        let downloads = storage.downloads;
        if (downloads.length !== 0) {
            for (let track of downloads) {
                if (track === null) continue;
                let { artist, shortTitle, url } = track;
                let trackWrapper = document.createElement("div");
                trackWrapper.classList.add("track-wrapper");

                trackWrapper.innerHTML = `
        <span class="track-title">
		    <span class="shortTitle">${shortTitle}</span> <br>
		    <span class="artist">${artist}</span>
	    </span>
	    <button class="button button-delete-track delete"
	        data-id="${downloads.indexOf(track)}">Delete</button>
	    <button data-url="${url}" class="button button-download-track">Download</button>
	`;
                navButtons.parentNode.insertBefore(
                    trackWrapper,
                    navButtons.nextSibling
                );
                document
                    .querySelector(".button-download-track")
                    .addEventListener("click", downloadTrack);

                document
                    .querySelector(".button-delete-track")
                    .addEventListener("click", deleteTrack);
            }
        } else {
            showEmptyDownloadsText();
        }
    });
}

function deleteTrack(event) {
    getDownloadsFromStorage().then((storage) => {
        let downloads = storage.downloads;
        let id = Number(event.target.dataset.id);
        downloads[id] = null;
        event.target.parentNode.remove();
        chrome.storage.local.set({ downloads });

        if (downloads.every((elem) => elem === null)) {
            showEmptyDownloadsText();
            initializeDownloadStore();
        }
    });
}

function downloadTrack(event) {
    let { artist, title, url } = getTrackInfo(event.target);
    let filename = `${artist} - ${title}.mp3`.replace(
        /[`~!@#$%^&*_|+=?;:'",<>{}[\]\\/]/gi,
        ""
    );
    chrome.runtime.sendMessage({ type: "downloadTrack", filename, url });
}

function getTrackInfo(track) {
    let url = track.dataset.url;
    let artist = track.parentNode.querySelector(".artist").textContent;
    let title = track.parentNode.querySelector(".shortTitle").textContent;
    return { artist, title, url };
}

renderTracks();
