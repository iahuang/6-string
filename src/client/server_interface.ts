async function api_get(endpoint: string, params: any) {
    // fetch be like "no query functionality lmao"
    let esc = encodeURIComponent;
    let query = Object.keys(params)
        .map((k) => esc(k) + "=" + esc(params[k]))
        .join("&");

    let response = await fetch(
        "/api/" + endpoint + "?" + query,
        {
            method: "GET",
        }
    );

    return await response.json();
}
