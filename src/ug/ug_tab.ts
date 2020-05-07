import { loadStoreData } from "./ug";
import { UGPageData as UGTabPageData, Tab } from "./ug_tabdata_interfaces";

import fs from "fs";

interface UGTabInfo {
    key: string;
    capo: number;
    tuning: string;
    author: string;
}

interface TabSection {
    name: string;
    lines: Line[];
    tabs: Tabulature[];
}

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

function getLineType(line?: string) {
    // returns either "chord" or "lyric", null if line is undefined

    if (!line) {
        return null;
    }

    return line.match(/((\s+)?\[ch\][\w#\/]+\[\/ch\](\s+)?)+/g) !== null
        ? "chord"
        : "lyric";
}

interface LineChord {
    name: string;
    wordPosition: number | null;
}

interface Line {
    chords: LineChord[];
    words: string[];
}

function parseWordsFromLine(line: string) {
    return line.match(/\S+/g)!;
}

function parseChordsFromLine(line: string) {
    return line.match(/(?<=\])[\w\/#]+(?=\[)/g)!;
}

function matchChordsToLyrics(lyricsLine: string, chordsLine: string) {
    // remove [ch] and [/ch] markings
    chordsLine = chordsLine.replace(/\[\/?ch\]/g, "");

    // i need to convert these into arrays because for some reason i can only for..of over them once
    let chordMatches = Array.from(chordsLine.matchAll(/\S+/g));
    let wordMatches = Array.from(lyricsLine.matchAll(/\S+/g));

    let chords: LineChord[] = [];

    for (let chordMatch of chordMatches) {
        let chordPos = chordMatch.index!; // where in the string does the chord appear

        let previousWordPosition: number | null = null;
        let i = 0;
        for (let wordMatch of wordMatches) {
            if (wordMatch.index! <= chordPos) {
                previousWordPosition = i;
            }
            i++;
        }

        chords.push({
            name: chordMatch[0],
            wordPosition:
                previousWordPosition == null ? -1 : previousWordPosition,
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
        words: Array.from(lyricsLine.match(/\S+/g)!),
    };
}

function preRemoveTabs(text: string) {
    const tabPattern = /([a-gA-G]\|([|\-\/]|([\w\/\\\.~]+))+\|\n)+([a-gA-G]\|([|\-\/]|([\w\/\\\.~]+))+\|)/g;
    let tabs = text.match(tabPattern) || [];
    return { text: text.replace(tabPattern, ""), tabs: Array.from(tabs) };
}

interface TabNote {
    fret: number | null;
    text: string;
}

interface Tabulature {
    // the thing with the notes and bars not the page itself
    strings: string[]; // as in like [e, b, g, d, a, e]
    timeline: { [string: string]: TabNote }[]; // time-ordered list of all notes played at that moment in time
}

function parseTabs(tabLines: string[]): Tabulature {
    // the regex returns a trailing newline so we should remove any blank lines
    //tabLines = tabLines.filter(line=>line!=="");

    let strings = tabLines.map((line) => line.match(/[a-gA-G](?=\|)/g)![0]); // extract the "e" from "e|-----------...----|"

    let notePositions: {
        [pos: number]: { note: string; string: string }[];
    } = {};

    // parse out notes into their positions along in the tab string
    let stringNumber = 0;

    for (let line of tabLines) {
        for (let note of line.matchAll(/(?<=-)[\w\/\\\.~]+/g)) {
            let pos = note.index!;
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
        ...Object.keys(notePositions).map((key) => Number.parseInt(key))
    );

    let timeline: { [stringNumber: number]: TabNote }[] = [];

    // notePositions might not be in order and this is faster than just sorting the keys

    for (let pos = 0; pos <= lastPos; pos++) {
        let notesAtPosition = notePositions[pos];

        if (notesAtPosition) {
            let chord: { [string: string]: TabNote } = {};

            for (let note of notesAtPosition) {
                // parse out the fret number from the note text
                let fret;
                try {
                    fret = Number.parseInt(note.note.match(/\d+/g)![0]);
                } catch (error) {
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

function parseSectionContent(text: string) {
    var { text, tabs } = preRemoveTabs(text);

    let lines = text.split("\n").filter((line) => line.trim() !== ""); // remove blank lines

    let i = 0;

    let parsedLines: Line[] = [];

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
            } else {
                parsedLines.push(matchChordsToLyrics(line, previousLine));
            }
        } else {
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
            } else {
                // don't do anything, the next iteration will take care of it
            }
        }

        i += 1;
    }

    return { lines: parsedLines, tabStrings: tabs };
}

// returns a list of sections with their content as an unparsed sting
function parseSections(text: string): { name: string; content: string }[] {
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
    let sections: { name: string; content: string }[] = [];

    let i = 0;
    for (let sectionHeader of sectionHeaders) {
        let nextSectionHeader = sectionHeaders[i + 1];

        if (!nextSectionHeader) {
            // there is no next section
            nextSectionHeader = "$"; // stop at end of string instead of looking for the next section header
        } else {
            nextSectionHeader = escapeRegExp(nextSectionHeader); // to incorporate it into our regex pattern we should escape it first
        }

        //console.log([sectionHeader, nextSectionHeader], currentSection);

        // match everything up to the next section header
        let sectionContent = currentSection.match(
            new RegExp(`^.+?(?=${nextSectionHeader})`, "gs")
        )![0];

        //console.log([sectionContent]);

        currentSection = currentSection
            .substr(sectionContent?.length - 1)
            .trim(); // consume the part we just parsed

        // Remove the section header from the parsed content and remove leading newlines
        sectionContent = sectionContent
            .replace(
                new RegExp(`(.+?)?${escapeRegExp(sectionHeader)}`, "gs"),
                ""
            )
            .trim();

        sections.push({
            name: sectionHeader.match(/[^\[\]]+/g)![0], // remove the surrounding brackets from the section header
            content: sectionContent,
        });

        i++;
    }
    return sections;
}

export class UGTab {
    info: UGTabInfo;
    songName: string;
    songArtist: string;
    sections: TabSection[] = [];
    constructor(pageData: UGTabPageData) {
        // Load and parse tab data from a the page data inside js-store
        this.info = {
            key: pageData.tab_view.meta.tonality || "unknown",
            capo: pageData.tab_view.meta.capo || 0,
            tuning: pageData.tab_view.meta.tuning.value || "unknown",
            author: pageData.tab.username || "unknown",
        };
        this.songArtist = pageData.tab.artist_name;
        this.songName = pageData.tab.song_name;

        this.sections = parseSections(pageData.tab_view.wiki_tab.content).map(
            (parsedSection) => {
                let sectionName = parsedSection.name;
                let sectionContentString = parsedSection.content;

                let { lines, tabStrings } = parseSectionContent(
                    sectionContentString
                );

                return {
                    name: sectionName,
                    lines: lines,
                    tabs: tabStrings.map((tab) => parseTabs(tab.split("\n"))),
                };
            }
        );
    }

    get fullSongName() {
        return `${this.songArtist} - ${this.songName}`;
    }

    getAllChords() {
        // returns a list of all chords used in this tab
        let chordSet = new Set<string>();

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

function unescapeHTML(text: string) {
    // replace HTML escape caracters with their original counterparts
    return text
        .replace("&amp", "&")
        .replace("&lt", "<")
        .replace("&gt", ">")
        .replace("&quot", '"')
        .replace("&#x27", "'");
}

// load UGTab instance from UltimateGuitar page data
export default async function loadTabPage(url: string) {
    return new UGTab(await loadStoreData(url));
}

export function debugTabPageDump(url: string) {
    loadTabPage(url).then((tab) =>
        fs.writeFileSync(tab.fullSongName + ".json", JSON.stringify(tab))
    );
}
