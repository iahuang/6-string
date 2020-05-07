import fetch from "node-fetch";
import jsdom from "jsdom";
const { JSDOM } = jsdom;

function unescapeHTML(text: string) {
    // replace HTML escape caracters with their original counterparts
    return text
        .replace("&amp", "&")
        .replace("&lt", "<")
        .replace("&gt", ">")
        .replace("&quot", '"')
        .replace("&#x27", "'");
}

export async function loadStoreData(url: string) {
    let response = await fetch(url, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36",
        },
    });
    let dom = new JSDOM(await response.text());

    let dataContent = dom.window.document
        .getElementsByClassName("js-store")[0]
        .getAttribute("data-content")!; // tab data happens to be stored in a div labeled "js-store". this is the basis for the UGTab constructor

    // go directly to the useful data, most of it is google analytics/ad related
    return JSON.parse(unescapeHTML(dataContent)).store.page.data;
}
