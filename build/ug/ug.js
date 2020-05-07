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
const node_fetch_1 = __importDefault(require("node-fetch"));
const jsdom_1 = __importDefault(require("jsdom"));
const { JSDOM } = jsdom_1.default;
function unescapeHTML(text) {
    // replace HTML escape caracters with their original counterparts
    return text
        .replace("&amp", "&")
        .replace("&lt", "<")
        .replace("&gt", ">")
        .replace("&quot", '"')
        .replace("&#x27", "'");
}
function loadStoreData(url) {
    return __awaiter(this, void 0, void 0, function* () {
        let response = yield node_fetch_1.default(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36",
            },
        });
        let dom = new JSDOM(yield response.text());
        let dataContent = dom.window.document
            .getElementsByClassName("js-store")[0]
            .getAttribute("data-content"); // tab data happens to be stored in a div labeled "js-store". this is the basis for the UGTab constructor
        // go directly to the useful data, most of it is google analytics/ad related
        return JSON.parse(unescapeHTML(dataContent)).store.page.data;
    });
}
exports.loadStoreData = loadStoreData;
