import fs from "fs";
import { ArtistSearch, GeneralSearch } from "./ug_searchdata_interfaces";
import { loadStoreData } from "./ug";
import fetch from "node-fetch";
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

function processSearchResults(
    pageData: GeneralSearch.SearchData
): ProcessedSearchResults {
    // this function is a mess

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

    let songInfo: {
        [name: string]: {
            artistName: string;
            songName: string;
            artistUrl: string;
        };
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

        songInfo[songIdentifier] = {
            artistName: result.artist_name,
            songName: result.song_name,
            artistUrl: result.artist_url,
        };
    }

    let output: ProcessedSearchResults = {
        results: [],
        numberTotalResults: pageData.results_count
    };

    // get the highest rated song of each category and add it to the final output

    for (let [songIdentifier, categories] of Object.entries(songs)) {
        let song = songInfo[songIdentifier];

        let songResult: SongResult = {
            songName: song.songName,
            artistName: song.artistName,
            artistUrl: song.artistUrl,
            categories: [],
        };

        for (let category of Object.keys(categories)) {
            let bestTabInCategory = _.maxBy(
                categories[category],
                (result) => result.rating!
            )!;

            songResult.categories.push({
                category: category,
                url: bestTabInCategory.tab_url,
            });
        }

        output.results.push(songResult);
    }

    return output;
}

export async function search(query: string, page: number) {
    return processSearchResults(
        await loadStoreData(
            `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURI(
                query
            )}&page=${page}`
        )
    );
}

export async function searchAutocomplete(query: string) {
    /* Returns Ultimate Guitar's search suggestion for the given query */

    // ultimate guitar does this really weirdly idk what the devs were on when they made this system

    if (!query) {
        return [];
    }

    query = query.trim();
    let queryFile = query.replace(" ", "_").substring(0, 5) + ".js";

    let response = await fetch(
        `https://tabs.ultimate-guitar.com/static/article/suggestions/${query[0]}/${queryFile}`
    );

    if (response.ok) {
        // get pranked it's not really a js file it's just some json data ????
        let allSuggestions: string[] = (await response.json()).suggestions;
        return allSuggestions.filter((suggestion) =>
            suggestion.startsWith(query)
        );
    } else {
        return [];
    }
}
