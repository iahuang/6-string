import * as express from "express";
import process from "process";
import { search, searchAutocomplete } from "../ug/ug_query";

export class SixString {
    app: express.Express;
    constructor() {
        this.app = express.default();

        // make site root serve search page
        this.app.get("/", (req, res) => {
            res.sendFile(this.staticDir + "/search.html");
        });

        // http://localhost:5000/tab/joji/slow-dancing-in-the-dark-chords-2470894
        this.app.get("/tab/:artist/:name", (req, res)=>{
            res.json(req.params);
        });

        // set static path
        this.app.use(express.static(this.staticDir));

        // init api endpoints
        this.apiGetEndpoint("search", (query) => {
            let searchResults = search(query.query, query.page);
            return searchResults;
        });

        this.apiGetEndpoint("search-suggestions", (query) => {
            return searchAutocomplete(query.query as string);
        });
    }

    start(port: number) {
        this.app.listen(port, () => {
            console.log(`Listening on port ${port}`);
        });
    }

    get staticDir() {
        return process.cwd() + "/static";
    }

    apiGetEndpoint(
        endpoint: string,
        cb: (query: any, req?: express.Request) => object
    ) {
        this.app.get("/api/" + endpoint, async (req, res) => {
            let responseData = cb(req.query, req);
            if (responseData instanceof Promise) {
                res.json(await responseData);
            } else {
                res.json(responseData);
            }
        });
    }
}
