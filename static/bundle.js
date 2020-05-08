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
            .class("color-1"), span(" – ").class("diminished"), span(this.songName))).class("search-result-song-info"), div(...catgoryButtons).class("search-result-categories")).class("search-result-box");
    }
}
let searchResults = [];
class SearchBox extends Component {
    constructor() {
        super();
        this.hideSearchSuggestions = false; // hide search suggestions when input is not focused
        this.hasSearchedYet = false;
        this.searchSuggestions = [];
    }
    renderSuggestionsBox() {
        if (this.searchSuggestions.length && !this.hideSearchSuggestions) {
            return div(...this.searchSuggestions.map((s) => span(s)))
                .class("suggestions")
                .onClick((event) => {
                let el = event.target;
                this.setSearchEntry(el.innerText);
            });
        }
        else {
            return null;
        }
    }
    renderSearchResults() {
        if (!this.hasSearchedYet) {
            return div(null);
        }
        if (searchResults.length) {
            return div(span(`${searchResults.length} results found`).class("diminished"), div(...searchResults));
        }
        else {
            return div("No results found");
        }
    }
    getSearchEntry() {
        return document.getElementById("search-box")
            .value;
    }
    setSearchEntry(to) {
        document.getElementById("search-box").value = to;
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
                api_get("search", {
                    query: this.getSearchEntry(),
                }).then((val) => {
                    searchResults = val.results.map((result) => new SearchResult(result));
                    this.hasSearchedYet = true;
                    htmless.rerender("search-results");
                });
            }
        })
            .onEvent("input", (event) => {
            api_get("search-suggestions", {
                query: this.getSearchEntry(),
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
            this.hideSearchSuggestions = true;
            htmless.rerender("suggestions");
        })
            .style({ marginBottom: "20px" }), inlineComponent(() => div(this.renderSuggestionsBox())).id("suggestions")), inlineComponent(() => this.renderSearchResults()).id("search-results"));
    }
}
let app = div(div(headers.h1("Ultimate Guitar"), new SearchBox()).class("search"), div("This site is not affiliated with ultimate-guitar.com").class("footer")).class("app");
document.body.appendChild(app.render());
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
