"use strict";
let app = div(div(headers.h1("sixstring"), input
    .text()
    .placeholder("Search for a song or artist")
    .spellcheck(false)
    .onEvent("keydown", (_event) => {
    let event = _event;
    if (event.keyCode === 13) {
        api_get("search", {
            query: event.target.value,
        }).then((val) => {
            console.log(val);
        });
    }
})).class("search"), div("This site is not affiliated with ultimate-guitar.com").class("footer")).class("app");
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
