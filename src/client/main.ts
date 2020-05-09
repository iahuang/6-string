class SearchResult extends Component implements SongResult {
    songName: string;
    artistUrl: string;
    artistName: string;
    categories: { category: string; url: string }[];
    constructor(result: SongResult) {
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
        return div(
            div(
                span(
                    hyperlink(this.artistName)
                        .href(this.artistUrl)
                        .class("color-1"),
                    span(" – ").class("diminished"),
                    span(this.songName)
                )
            ).class("search-result-song-info"),
            div(...catgoryButtons).class("search-result-categories")
        ).class("search-result-box");
    }
}

let searchResults: ProcessedSearchResults | null = null;

class SearchBox extends Component {
    searchSuggestions: string[];
    hideSearchSuggestions = false; // hide search suggestions when input is not focused
    hasSearchedYet = false;
    constructor() {
        super();
        this.searchSuggestions = [];
    }
    renderSuggestionsBox() {
        if (this.searchSuggestions.length && !this.hideSearchSuggestions) {
            let parent = document.getElementById("search-box");

            return div(...this.searchSuggestions.map((s) => span(s)))
                .class("suggestions")
                .onEvent("mousedown", (event) => {
                    let el = event.target as HTMLElement;
                    this.setSearchEntry(el.innerText);
                })
                .style({
                    top: parent?.getBoundingClientRect().bottom + "px",
                    left: parent?.getBoundingClientRect().left + "px",
                });
        } else {
            return null;
        }
    }
    renderSearchResults() {
        if (!this.hasSearchedYet) {
            return div(null);
        }
        if (searchResults) {
            return div(
                span(`${searchResults.numberTotalResults} results found`).class(
                    "diminished"
                ),
                div(
                    ...searchResults.results.map(
                        (result) => new SearchResult(result)
                    )
                )
            );
        } else {
            return div("No results found");
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
            div(
                input
                    .text()
                    .id("search-box")
                    .placeholder("Search for a song or artist")
                    .spellcheck(false)
                    .onEvent("keydown", (_event) => {
                        let event = _event as KeyboardEvent;
                        if (event.keyCode === 13) {
                            document.getElementById("search-box")?.blur();
                            api_get("search", {
                                query: this.getSearchEntry(),
                            }).then((val: ProcessedSearchResults) => {
                                searchResults = val;
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
                    .onEvent(
                        "blur",
                        (event) => {
                            // close the search bar after 100ms so that if the suggestions overlay is clicked it has time to register
                            setTimeout(() => {
                                this.hideSearchSuggestions = true;
                                htmless.rerender("suggestions");
                            }, 100);
                        },
                        false
                    )
                    .style({ marginBottom: "20px" }),
                inlineComponent(() => div(this.renderSuggestionsBox())).id(
                    "suggestions"
                )
            ),
            inlineComponent(() => this.renderSearchResults()).id(
                "search-results"
            )
        );
    }
}

let app = div(
    div(headers.h1("Ultimate Guitar"), new SearchBox()).class("search"),
    div("This site is not affiliated with ultimate-guitar.com").class("footer")
).class("app");

document.body.appendChild(app.render());
