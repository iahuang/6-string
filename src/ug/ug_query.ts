import fs from "fs";
import { ArtistSearch, GeneralSearch } from "./ug_searchdata_interfaces";
import { loadStoreData } from "./ug";
import _ from "lodash";

export async function artistSearch(letter: string, page: number) {
    return (await loadStoreData(
        `https://www.ultimate-guitar.com/bands/${letter}${page}.htm`
    )) as ArtistSearch.ArtistSearchData;
}

const searchQueryLetters = JSON.parse(
    '["a","b","d","e","f","g","h","i","j","k","l","m","o","p","q","r","s","t","u","v","w","x","y","z","0-9"]'
);

export async function getAllArtists() {
    let artists: { name: string; url: string; id: number }[] = [];

    for (let letter of searchQueryLetters) {
        let initialSearch = await artistSearch(letter, 1);

        // get total page count from search metadata
        let pages = initialSearch.page_count;

        for (let page = 1; page < pages + 1; page++) {
            console.log(
                `Searching for artists... (letter=${letter}, page=${page}/${pages})`
            );
            let searchResults = await artistSearch(letter, page);

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
}

function processSearchResults(pageData: GeneralSearch.SearchData) {
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
    let songs: {
        [name: string]: { [category: string]: GeneralSearch.Result[] };
    } = {};

    for (let result of pageData.results) {
        if (result.marketing_type) {
            // skip the "official" tabs
            continue;
        }

        let songIdentifier = result.artist_name + " - " + result.song_name;
        if (!songs[songIdentifier]) {
            songs[songIdentifier] = {};
        }
        if (!songs[songIdentifier][result.type!]) {
            songs[songIdentifier][result.type!] = [];
        }

        songs[songIdentifier][result.type!].push(result);
    }

    // prune each song category to contain only the highest rated tab

    for (let [song, categories] of Object.entries(songs)) {
        for (let category of Object.keys(categories)) {
            let bestTabInCategory = _.maxBy(
                categories[category],
                (result) => result.rating!
            );
            // hack to reformat the songs variable where the category value is just the url of the highest rated tab
            (categories[category] as any) = bestTabInCategory!.tab_url;
        }
    }

    // this is the new format for songs
    type newSongsFormat = {
        [name: string]: { [category: string]: string };
    };

    return songs as unknown as newSongsFormat;
    
}

export async function search(query: string, page: number) {
    let pageData = await loadStoreData(
        `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURI(
            query
        )}&page=${page}`
    );
    fs.writeFileSync("test.json", JSON.stringify(processSearchResults(pageData)));
}
