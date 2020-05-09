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
        )
            .class("search-result-box")
            .class("fade-in");
    }
}

class SearchBox extends Component {
    searchSuggestions: string[];
    hideSearchSuggestions = false; // hide search suggestions when input is not focused
    hasSearchedYet = false;

    searchPage = 1;
    searchQuery = "";

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
    renderSearchResults(searchResults: ProcessedSearchResults) {
        if (searchResults) {
            return div(
                // span(`${searchResults.numberTotalResults} results found`).class(
                //     "diminished"
                // ),
                div(
                    ...searchResults.results.map(
                        (result) => new SearchResult(result)
                    )
                ),
                button("load more")
                    .onClick(() => {
                        this.loadNextPageSearchResults();
                    })
                    .id("load-more-button")
            );
        } else {
            return div("No results found");
        }
    }

    getInputValue() {
        return (document.getElementById("search-box")! as HTMLInputElement)
            .value;
    }
    setSearchEntry(to: string) {
        (document.getElementById("search-box")! as HTMLInputElement).value = to;
    }

    addPage(searchResults: ProcessedSearchResults) {
        console.log(this.renderSearchResults(searchResults).render());
        document.getElementById("load-more-button")?.remove();
        document
            .getElementById("search-result-container")
            ?.appendChild(this.renderSearchResults(searchResults).render());
    }
    loadSearchResults() {
        api_get("search", {
            query: this.searchQuery,
            page: 1,
        }).then((val: ProcessedSearchResults) => {
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
        }).then((val: ProcessedSearchResults) => {
            // add new search results to existing search result data
            this.addPage(val);
            //htmless.rerender("search-results");
        });
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
            div().id("search-result-container")
        );
    }
}

let app = div(
    div(headers.h1("Ultimate Guitar"), new SearchBox()).class("search"),
    div("This site is not affiliated with ultimate-guitar.com").class("footer")
).class("app");

document.body.appendChild(app.render());
