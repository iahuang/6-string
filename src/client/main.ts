let app = div(
    div(
        headers.h1("sixstring"),
        input
            .text()
            .placeholder("Search for a song or artist")
            .spellcheck(false)
            .onEvent("keydown", (_event) => {
                let event = _event as KeyboardEvent;
                if (event.keyCode === 13) {
                    api_get("search", {
                        query: (event.target as HTMLInputElement).value,
                    }).then((val) => {
                        console.log(val);
                    });
                }
            })
    ).class("search"),
    div (
        "This site is not affiliated with ultimate-guitar.com"
    ).class("footer")
).class("app");

document.body.appendChild(app.render());
