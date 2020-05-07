"use strict";
/* disclaimer: I know nothing about music theory */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
const transposeChartSharp = [
    "A",
    "A#",
    "B",
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
];
const transposeChartFlat = [
    "A",
    "Bb",
    "B",
    "C",
    "Db",
    "D",
    "Eb",
    "E",
    "F",
    "Gb",
    "G",
    "Ab",
];
function mod(a, b) {
    return ((a % b) + b) % b;
}
function chordDifficulty(chord) {
    /* Returns a very arbitrary measure of how "difficult" a chord is to play (on a guitar). Higher = more difficult */
    let difficulty = 0;
    if (chord.match(/[A-Z](b|#)/)) {
        // oh no it's a sharp/flat it's going to be tricky no matter what
        difficulty += 2;
    }
    else {
        if (chord.match(/[A-Z]m/) && ["B", "C", "F", "G"].includes(chord[0])) {
            // Bm, Cm, Fm, and Gm are harder to play
            difficulty += 1;
        }
        else if (chord[0] === "F" || chord[0] === "B") {
            // F and B (not minor) are harder to play by themselves
            difficulty += 1;
        }
    }
    // random chords that are easier/harder to play than they "look"
    if (chord === "Fmaj7") {
        difficulty -= 1;
    }
    if (chord === "F#7") {
        difficulty -= 1;
    }
    if (chord === "B7") {
        difficulty -= 1;
    }
    if (chord === "C7") {
        difficulty += 1;
    }
    if (chord === "F7") {
        difficulty += 1;
    }
    if (chord.includes("9")) {
        // good luck playing those 9s
        difficulty += 1;
    }
    return difficulty;
}
function autoTransposeChords(chordsList, range = [-12, 12]) {
    /* Transposes a set of chords to make them "easier" to play on the guitar. Returns the number of steps to transpose by */
    let chords = Array.from(new Set(chordsList)); // remove duplicates
    // function to calculate average difficulty for a set of chords transposed a number of steps
    let calcAvgDifficulty = (steps) => lodash_1.default.meanBy(chordsList, (chord) => chordDifficulty(transpose(chord, steps)));
    // find minimum difficulty
    let easiestSteps = 0;
    for (let steps = range[0]; steps < range[1] + 1; steps++) {
        console.log("steps", steps, "avg difficulty", calcAvgDifficulty(steps), "chords", chords.map(ch => transpose(ch, steps)));
        if (calcAvgDifficulty(steps) < calcAvgDifficulty(easiestSteps)) {
            easiestSteps = steps;
        }
    }
    return easiestSteps;
}
exports.autoTransposeChords = autoTransposeChords;
function transpose(chord, steps) {
    // capitalize first letter, just in case
    chord = chord[0].toUpperCase() + chord.substr(1);
    if (chord.includes("/")) {
        // if it's something like C/E, transpose them separately
        return chord
            .split("/")
            .map((subChord) => transpose(subChord, steps))
            .join("/");
    }
    // transpose in "sharp" mode by default unless the chord being transposed is flat
    let mode = chord.includes("b") ? "flat" : "sharp";
    // choose the appropriate chord chart
    let transposeChart = mode === "flat" ? transposeChartFlat : transposeChartSharp;
    // assuming a chord like C#maj7:
    let chordBase = chord.match(/[A-Z][b#]?/g)[0]; // "C#"
    let chordModifier = chord.substr(chordBase.length); // "maj7"
    let startingPos = transposeChart.indexOf(chordBase);
    if (startingPos === undefined) {
        throw new Error(`invalid chord "${chord}"`);
    }
    let transposedChordBase = transposeChart[mod(startingPos + steps, transposeChart.length)];
    return transposedChordBase + chordModifier;
}
exports.transpose = transpose;
