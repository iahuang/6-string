"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const ug_1 = require("./ug");
const lodash_1 = __importDefault(require("lodash"));
function artistSearch(letter, page) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield ug_1.loadStoreData(`https://www.ultimate-guitar.com/bands/${letter}${page}.htm`));
    });
}
exports.artistSearch = artistSearch;
const searchQueryLetters = JSON.parse('["a","b","d","e","f","g","h","i","j","k","l","m","o","p","q","r","s","t","u","v","w","x","y","z","0-9"]');
function getAllArtists() {
    return __awaiter(this, void 0, void 0, function* () {
        let artists = [];
        for (let letter of searchQueryLetters) {
            let initialSearch = yield artistSearch(letter, 1);
            // get total page count from search metadata
            let pages = initialSearch.page_count;
            for (let page = 1; page < pages + 1; page++) {
                console.log(`Searching for artists... (letter=${letter}, page=${page}/${pages})`);
                let searchResults = yield artistSearch(letter, page);
                // add artists to database
                for (let artist of searchResults.artists) {
                    artists.push({
                        name: artist.name,
                        id: artist.id,
                        url: "https://www.ultimate-guitar.com" + artist.artist_url,
                    });
                }
            }
        }
        return artists;
    });
}
exports.getAllArtists = getAllArtists;
function processSearchResults(pageData) {
    /*
        example data for "songs" with query "never gonna":
        
        songs = {
            "rick astley - never gonna give you up": {
                "chords": [
                    <GeneralSearch.Result>,
                    <GeneralSearch.Result>,
                    ...
                ],
                "tabs": [
                    <GeneralSearch.Result>,
                    <GeneralSearch.Result>,
                    ...
                ]
            },
            "jonathan jeremiah - never gonna": {
                "chords": [
                    ...
                ]
            }
        }
    */
    let songs = {};
    for (let result of pageData.results) {
        if (result.marketing_type) {
            // skip the "official" tabs
            continue;
        }
        let songIdentifier = result.artist_name + " - " + result.song_name;
        if (!songs[songIdentifier]) {
            songs[songIdentifier] = {};
        }
        if (!songs[songIdentifier][result.type]) {
            songs[songIdentifier][result.type] = [];
        }
        songs[songIdentifier][result.type].push(result);
    }
    // prune each song category to contain only the highest rated tab
    for (let [song, categories] of Object.entries(songs)) {
        for (let category of Object.keys(categories)) {
            let bestTabInCategory = lodash_1.default.maxBy(categories[category], (result) => result.rating);
            // hack to reformat the songs variable where the category value is just the url of the highest rated tab
            categories[category] = bestTabInCategory.tab_url;
        }
    }
    return songs;
}
function search(query, page) {
    return __awaiter(this, void 0, void 0, function* () {
        let pageData = yield ug_1.loadStoreData(`https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURI(query)}&page=${page}`);
        fs_1.default.writeFileSync("test.json", JSON.stringify(processSearchResults(pageData)));
    });
}
exports.search = search;
