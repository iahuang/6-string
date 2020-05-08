import loadTabPage, { debugTabPageDump } from "./ug/ug_tab";
import fs from "fs";
import { transpose, autoTransposeChords } from "./chord_utils";
import { search } from "./ug/ug_query";

console.log(autoTransposeChords(["B", "C#", "F#", "Bm", "E", "G#"]))