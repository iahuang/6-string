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
const ug_1 = require("./ug");
const fs_1 = __importDefault(require("fs"));
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}
function getLineType(line) {
    // returns either "chord" or "lyric", null if line is undefined
    if (!line) {
        return null;
    }
    return line.match(/((\s+)?\[ch\][\w#\/]+\[\/ch\](\s+)?)+/g) !== null
        ? "chord"
        : "lyric";
}
function parseWordsFromLine(line) {
    // "mary had   a   little  lamb" -> ["mary", "had", "a", "little", "lamb"]
    return line.match(/\S+/g);
}
function parseChordsFromLine(line) {
    // "[ch]Em[/ch]   [ch]Am[/ch]  " -> ["Em", "Am"]
    return line.match(/(?<=\])[\w\/#]+(?=\[)/g);
}
function matchChordsToLyrics(lyricsLine, chordsLine) {
    /*

        -- simplified overview of this fucntion --

        chords: "E    Am    G      D   "
        lyrics: "mary had a little lamb"

        output:

        chords: [
            E at word 0 ("mary"),
            Am at word 1 ("had"),
            G at word 3 ("little"),
            D at word 4 ("lamb")
        ]
        words: [
            "mary",
            "had",
            "a",
            "little",
            "lamb"
        ]

    */
    // remove [ch] and [/ch] markings because they affect the position of the chord in the string
    chordsLine = chordsLine.replace(/\[\/?ch\]/g, "");
    // i need to convert these into arrays because for some reason i can only for..of over them once
    let chordMatches = Array.from(chordsLine.matchAll(/\S+/g)); // we don't use parseChordsFromLine anymore since we just removed all the [ch] markings
    let wordMatches = Array.from(lyricsLine.matchAll(/\S+/g));
    let chords = [];
    for (let chordMatch of chordMatches) {
        let chordPos = chordMatch.index; // where in the string does the chord appear
        // if previousWordPosition is null, that means the chord becomes before any words in the lyrics line
        let previousWordPosition = null;
        let i = 0; // word index
        for (let wordMatch of wordMatches) {
            // if the chord appears after the start of the word
            // then the chord must be linked to that word (or maybe the next one we dont know yet)
            if (wordMatch.index <= chordPos) {
                previousWordPosition = i;
            }
            i++;
        }
        chords.push({
            name: chordMatch[0],
            wordPosition: previousWordPosition == null ? -1 : previousWordPosition,
        });
    }
    // console.log({
    //     Lline: lyricsLine,
    //     Cline: chordsLine,
    //     chords: chords,
    //     words: Array.from(lyricsLine.match(/\S+/g)!),
    // });
    return {
        chords: chords,
        words: Array.from(lyricsLine.match(/\S+/g)),
    };
}
function preRemoveTabs(text) {
    const tabPattern = /([a-gA-G]\|([|\-\/]|([\w\/\\\.~]+))+\|\n)+([a-gA-G]\|([|\-\/]|([\w\/\\\.~]+))+\|)/g;
    let tabs = text.match(tabPattern) || [];
    return { text: text.replace(tabPattern, ""), tabs: Array.from(tabs) };
}
function parseTabs(tabLines) {
    /*
        tabLines is an ascii tab like this, but split on every newline:

        e|---------------------------------------------------------------------------|
        B|-------0------------0------------0-----------------------------------------|
        G|-----0---0--------2---2--------0---0---------------------------------------|
        D|---2-------2----1-------1----0-------0-------------------------------------|
        A|---------------------------------------3-2-0-------------------------------|
        E|-0------------2------------3-----------------3-----------------------------|
    */
    /*

        note from future me:

        This function internally represents tab data with the index of the guitar string (like "0")
        but returns the name of the guitar string (like "E"). this is why you dont write code
        while sleep deprived

        this function "just works" and you probably shouldnt touch it or think too much
        about why it works

    */
    // strings as in a guitar string
    let strings = tabLines.map((line) => line.match(/[a-gA-G](?=\|)/g)[0]); // extract the "e" from "e|-----------...----|"
    let notePositions = {};
    // parse out notes into their positions along in the tab string
    let stringNumber = 0;
    // note from future me: idk wtf this loop does gl
    for (let line of tabLines) {
        for (let note of line.matchAll(/(?<=-)[\w\/\\\.~]+/g)) {
            let pos = note.index;
            if (!notePositions[pos]) {
                notePositions[pos] = [];
            }
            notePositions[pos].push({
                note: note[0],
                string: strings[stringNumber],
            });
        }
        stringNumber++;
    }
    // figure out what (string) position the tab ends at
    let lastPos = Math.max(
    // Object.keys always returns strings so we need to convert them to numbers first
    ...Object.keys(notePositions).map((key) => Number.parseInt(key)));
    let timeline = [];
    // notePositions might not be in order and this is faster than just sorting the keys
    for (let pos = 0; pos <= lastPos; pos++) {
        let notesAtPosition = notePositions[pos];
        if (notesAtPosition) {
            let chord = {};
            for (let note of notesAtPosition) {
                // parse out the fret number from the note text
                let fret;
                try {
                    fret = Number.parseInt(note.note.match(/\d+/g)[0]);
                }
                catch (error) {
                    // maybe it doesn't list a fret position idk
                    fret = null;
                }
                // build a TabNote and add it to the chord
                chord[note.string] = { fret: fret, text: note.note };
            }
            // add the chord to the timeline
            timeline.push(chord);
        }
    }
    return { strings: strings, timeline: timeline };
}
function parseSectionContent(text) {
    var { text, tabs } = preRemoveTabs(text);
    let lines = text.split("\n").filter((line) => line.trim() !== ""); // remove blank lines
    let i = 0;
    let parsedLines = [];
    for (let line of lines) {
        let type = getLineType(line);
        if (type == "lyric") {
            let previousLine = lines[i - 1];
            if (!previousLine || getLineType(previousLine) !== "chord") {
                // no previous line or previous line does not denote chords
                // therefore line has no associated chord markings
                parsedLines.push({
                    chords: [],
                    words: parseWordsFromLine(line),
                });
            }
            else {
                parsedLines.push(matchChordsToLyrics(line, previousLine));
            }
        }
        else {
            // line type is "chord"
            let nextLine = lines[i + 1];
            if (!nextLine || getLineType(nextLine) !== "lyric") {
                // no next line or next line does not denote lyrics
                // therefore line depicts just chords w/ no lyrics
                parsedLines.push({
                    chords: parseChordsFromLine(line).map((chordName) => {
                        return { name: chordName, wordPosition: null };
                    }),
                    words: [],
                });
            }
            else {
                // don't do anything, the next iteration will take care of it
            }
        }
        i += 1;
    }
    return { lines: parsedLines, tabStrings: tabs };
}
// returns a list of sections with their content as an unparsed sting
function parseSections(text) {
    // good luck trying to understand this part lol
    text = text.replace(/\r/g, ""); // some tabs use windows line endings ew
    text = text
        .replace(/\[tab\]/g, "") // get rid of the tab markers, they mess things up
        .replace(/\[\/tab\]/g, "");
    let currentSection = text;
    let sectionHeaders = text.match(/\[(?!tab)(?!ch)[\w -]+\]/g); // should look something like "[Intro]", "[Chorus]", etc.
    if (!sectionHeaders) {
        // in the case that there are no sections and it's just one big thing
        // just like pretend it's a section called [main] with the content being the entire text body
        return [{ name: "main", content: text }];
    }
    //console.log(sectionHeaders);
    let sections = [];
    let i = 0;
    for (let sectionHeader of sectionHeaders) {
        let nextSectionHeader = sectionHeaders[i + 1];
        if (!nextSectionHeader) {
            // there is no next section
            nextSectionHeader = "$"; // stop at end of string instead of looking for the next section header
        }
        else {
            nextSectionHeader = escapeRegExp(nextSectionHeader); // to incorporate it into our regex pattern we should escape it first
        }
        //console.log([sectionHeader, nextSectionHeader], currentSection);
        // match everything up to the next section header
        let sectionContent = currentSection.match(new RegExp(`^.+?(?=${nextSectionHeader})`, "gs"))[0];
        //console.log([sectionContent]);
        currentSection = currentSection
            .substr((sectionContent === null || sectionContent === void 0 ? void 0 : sectionContent.length) - 1)
            .trim(); // consume the part we just parsed
        // Remove the section header from the parsed content and remove leading newlines
        sectionContent = sectionContent
            .replace(new RegExp(`(.+?)?${escapeRegExp(sectionHeader)}`, "gs"), "")
            .trim();
        sections.push({
            name: sectionHeader.match(/[^\[\]]+/g)[0],
            content: sectionContent,
        });
        i++;
    }
    return sections;
}
class UGTab {
    constructor(pageData) {
        this.sections = [];
        // Load and parse tab data from a the page data inside js-store
        this.info = {
            key: pageData.tab_view.meta.tonality || "unknown",
            capo: pageData.tab_view.meta.capo || 0,
            tuning: pageData.tab_view.meta.tuning.value || "unknown",
            author: pageData.tab.username || "unknown",
        };
        this.songArtist = pageData.tab.artist_name;
        this.songName = pageData.tab.song_name;
        this.searchUrl = pageData.tab_view.tab_search_link;
        // fs.writeFileSync(this.fullSongName+".all.json", JSON.stringify(pageData));
        // parse out all the sections and their string contents
        this.sections = parseSections(pageData.tab_view.wiki_tab.content).map((parsedSection) => {
            let sectionName = parsedSection.name;
            let sectionContentString = parsedSection.content;
            // parse the string contents into lyrical bits and ascii tabs
            let { lines, tabStrings } = parseSectionContent(sectionContentString);
            return {
                name: sectionName,
                lines: lines,
                // parse the ascii tabs into usable data
                tabs: tabStrings.map((tab) => parseTabs(tab.split("\n"))),
            };
        });
    }
    get fullSongName() {
        return `${this.songArtist} - ${this.songName}`;
    }
    getAllChords() {
        // returns a list of all chords used in this tab
        let chordSet = new Set();
        for (let section of this.sections) {
            for (let line of section.lines) {
                for (let chord of line.chords) {
                    chordSet.add(chord.name);
                }
            }
        }
        return Array.from(chordSet);
    }
}
exports.UGTab = UGTab;
function unescapeHTML(text) {
    // replace HTML escape caracters with their original counterparts
    return text
        .replace("&amp", "&")
        .replace("&lt", "<")
        .replace("&gt", ">")
        .replace("&quot", '"')
        .replace("&#x27", "'");
}
// load UGTab instance from UltimateGuitar page data
function loadTabPage(url) {
    return __awaiter(this, void 0, void 0, function* () {
        return new UGTab(yield ug_1.loadStoreData(url));
    });
}
exports.default = loadTabPage;
function debugTabPageDump(url) {
    loadTabPage(url).then((tab) => fs_1.default.writeFileSync(tab.fullSongName + ".json", JSON.stringify(tab)));
}
exports.debugTabPageDump = debugTabPageDump;
