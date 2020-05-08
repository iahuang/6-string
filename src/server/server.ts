import * as express from "express";
import process from "process";
import { search } from "../ug/ug_query";

export class SixString {
    app: express.Express;
    constructor() {
        this.app = express.default();

        // make site root serve index.html
        this.app.get("/", (req, res) => {
            res.sendFile(this.staticDir + "/index.html");
        });

        // set static path
        this.app.use(express.static(this.staticDir));

        // init api endpoints
        this.app.get("/api/search", async (req, res) => {
            let searchResults = await search(req.query["query"] as string, 1);
            res.send(searchResults);
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
}
