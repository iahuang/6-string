"use strict";
class SearchBox extends Component {
    constructor() {
        super();
        this.searchSuggestions = [];
    }
    renderSuggestionsBox() {
        if (this.searchSuggestions.length) {
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
    getSearchEntry() {
        return document.getElementById("search-box")
            .value;
    }
    setSearchEntry(to) {
        document.getElementById("search-box").value = to;
    }
    body() {
        return div(input
            .text()
            .id("search-box")
            .placeholder("Search for a song or artist")
            .spellcheck(false)
            .onEvent("keydown", (_event) => {
            let event = _event;
            if (event.keyCode === 13) {
                api_get("search", {
                    query: this.getSearchEntry(),
                }).then((val) => { });
            }
        })
            .onEvent("input", (event) => {
            api_get("search-suggestions", {
                query: this.getSearchEntry(),
            }).then((suggestions) => {
                this.searchSuggestions = suggestions;
                htmless.rerender("suggestions");
            });
        }), inlineComponent(() => div(this.renderSuggestionsBox())).id("suggestions"));
    }
}
let app = div(div(headers.h1("sixstring"), new SearchBox()).class("search"), div("This site is not affiliated with ultimate-guitar.com").class("footer")).class("app");
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
