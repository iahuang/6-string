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
function search(letter, page) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield ug_1.loadStoreData(`https://www.ultimate-guitar.com/bands/${letter}${page}.htm`));
    });
}
exports.search = search;
const searchQueryLetters = JSON.parse('["a","b","d","e","f","g","h","i","j","k","l","m","o","p","q","r","s","t","u","v","w","x","y","z","0-9"]');
function getAllArtists() {
    return __awaiter(this, void 0, void 0, function* () {
        let artists = [];
        for (let letter of searchQueryLetters) {
            let initialSearch = yield search(letter, 1);
            // get total page count from search metadata
            let pages = initialSearch.page_count;
            for (let page = 1; page < pages + 1; page++) {
                console.log(`Searching for artists... (letter=${letter}, page=${page}/${pages})`);
                let searchResults = yield search(letter, page);
                // add artists to database
                for (let artist of searchResults.artists) {
                    artists.push({
                        name: artist.name,
                        url: "https://www.ultimate-guitar.com" + artist.artist_url,
                    });
                }
                // save database
                fs_1.default.writeFileSync("artists.json", JSON.stringify(artists));
            }
        }
    });
}
exports.getAllArtists = getAllArtists;
