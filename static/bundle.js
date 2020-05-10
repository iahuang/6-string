"use strict";
class SearchResult extends Component {
    constructor(result) {
        super();
        this.songName = result.songName;
        this.artistUrl = result.artistUrl;
        this.artistName = result.artistName;
        this.categories = result.categories;
    }
    body() {
        let catgoryButtons = this.categories.map((category) => {
            return hyperlink(category.category)
                .href(category.url)
                .class("color-2");
        });
        return div(div(span(hyperlink(this.artistName)
            .href(this.artistUrl)
            .class("color-1"), span(" – ").class("diminished"), span(this.songName))).class("search-result-song-info"), div(...catgoryButtons).class("search-result-categories"))
            .class("search-result-box")
            .class("fade-in");
    }
}
class SearchBox extends Component {
    constructor() {
        super();
        this.hideSearchSuggestions = false; // hide search suggestions when input is not focused
        this.hasSearchedYet = false;
        this.searchPage = 1;
        this.searchQuery = "";
        this.searchSuggestions = [];
    }
    renderSuggestionsBox() {
        if (this.searchSuggestions.length && !this.hideSearchSuggestions) {
            let parent = document.getElementById("search-box");
            return div(...this.searchSuggestions.map((s) => span(s)))
                .class("suggestions")
                .onEvent("mousedown", (event) => {
                let el = event.target;
                this.setSearchEntry(el.innerText);
                this.loadSearchResults();
            })
                .style({
                top: (parent === null || parent === void 0 ? void 0 : parent.getBoundingClientRect().bottom) + "px",
                left: (parent === null || parent === void 0 ? void 0 : parent.getBoundingClientRect().left) + "px",
            });
        }
        else {
            return null;
        }
    }
    renderSearchResults(searchResults) {
        if (searchResults) {
            return div(
            // span(`${searchResults.numberTotalResults} results found`).class(
            //     "diminished"
            // ),
            div(...searchResults.results.map((result) => new SearchResult(result))), button("load more")
                .onClick(() => {
                this.loadNextPageSearchResults();
            })
                .id("load-more-button"));
        }
        else {
            return div("No results found");
        }
    }
    getInputValue() {
        return document.getElementById("search-box")
            .value;
    }
    setSearchEntry(to) {
        document.getElementById("search-box").value = to;
    }
    addPage(searchResults) {
        var _a, _b;
        console.log(this.renderSearchResults(searchResults).render());
        (_a = document.getElementById("load-more-button")) === null || _a === void 0 ? void 0 : _a.remove();
        (_b = document
            .getElementById("search-result-container")) === null || _b === void 0 ? void 0 : _b.appendChild(this.renderSearchResults(searchResults).render());
    }
    loadSearchResults() {
        api_get("search", {
            query: this.searchQuery,
            page: 1,
        }).then((val) => {
            document.getElementById("search-result-container").innerHTML = "";
            this.addPage(val);
            this.hasSearchedYet = true;
            //htmless.rerender("search-results");
        });
    }
    loadNextPageSearchResults() {
        this.searchPage += 1;
        api_get("search", {
            query: this.searchQuery,
            page: this.searchPage,
        }).then((val) => {
            // add new search results to existing search result data
            this.addPage(val);
            //htmless.rerender("search-results");
        });
    }
    body() {
        return div(div(input
            .text()
            .id("search-box")
            .placeholder("Search for a song or artist")
            .spellcheck(false)
            .onEvent("keydown", (_event) => {
            var _a;
            let event = _event;
            if (event.keyCode === 13) {
                (_a = document.getElementById("search-box")) === null || _a === void 0 ? void 0 : _a.blur();
                this.searchQuery = this.getInputValue();
                this.loadSearchResults();
            }
        })
            .onEvent("input", (event) => {
            api_get("search-suggestions", {
                query: this.getInputValue(),
            }).then((suggestions) => {
                this.searchSuggestions = suggestions;
                htmless.rerender("suggestions");
            });
        })
            .onEvent("focus", (event) => {
            this.hideSearchSuggestions = false;
            htmless.rerender("suggestions");
        })
            .onEvent("blur", (event) => {
            // close the search bar after 100ms so that if the suggestions overlay is clicked it has time to register
            setTimeout(() => {
                this.hideSearchSuggestions = true;
                htmless.rerender("suggestions");
            }, 100);
        }, false)
            .style({ marginBottom: "20px" }), inlineComponent(() => div(this.renderSuggestionsBox())).id("suggestions")), div().id("search-result-container"));
    }
}
function runSearchPageApp() {
    let app = div(div(headers.h1("Ultimate Guitar"), new SearchBox()).class("search"), div("This site is not affiliated with ultimate-guitar.com").class("footer")).class("app");
    document.body.appendChild(app.render());
}
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function api_get(endpoint, params) {
    return __awaiter(this, void 0, void 0, function* () {
        // fetch be like "no query functionality lmao"
        let esc = encodeURIComponent;
        let query = Object.keys(params)
            .map((k) => esc(k) + "=" + esc(params[k]))
            .join("&");
        let response = yield fetch("/api/" + endpoint + "?" + query, {
            method: "GET",
        });
        return yield response.json();
    });
}
