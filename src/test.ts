import loadTabPage, { debugTabPageDump } from "./ug/ug_tab";
import fs from "fs";
import { transpose, autoTransposeChords } from "./chord_utils";
import { search } from "./ug/ug_query";

search("never gonna", 1);