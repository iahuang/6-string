class SearchBox extends Component {
    searchSuggestions: string[];
    constructor() {
        super();
        this.searchSuggestions = [];
    }
    renderSuggestionsBox() {
        if (this.searchSuggestions.length) {
            return div(...this.searchSuggestions.map((s) => span(s)))
                .class("suggestions")
                .onClick((event) => {
                    let el = event.target as HTMLElement;
                    this.setSearchEntry(el.innerText);
                });
        } else {
            return null;
        }
    }
    getSearchEntry() {
        return (document.getElementById("search-box")! as HTMLInputElement)
            .value;
    }
    setSearchEntry(to: string) {
        (document.getElementById("search-box")! as HTMLInputElement).value = to;
    }
    body() {
        return div(
            input
                .text()
                .id("search-box")
                .placeholder("Search for a song or artist")
                .spellcheck(false)
                .onEvent("keydown", (_event) => {
                    let event = _event as KeyboardEvent;
                    if (event.keyCode === 13) {
                        api_get("search", {
                            query: this.getSearchEntry(),
                        }).then((val) => {});
                    }
                })
                .onEvent("input", (event) => {
                    api_get("search-suggestions", {
                        query: this.getSearchEntry(),
                    }).then((suggestions) => {
                        this.searchSuggestions = suggestions;
                        htmless.rerender("suggestions");
                    });
                }),
            inlineComponent(() => div(this.renderSuggestionsBox())).id(
                "suggestions"
            )
        );
    }
}

let app = div(
    div(headers.h1("sixstring"), new SearchBox()).class("search"),
    div("This site is not affiliated with ultimate-guitar.com").class("footer")
).class("app");

document.body.appendChild(app.render());
