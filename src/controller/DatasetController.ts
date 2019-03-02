import Log from "../Util";
import {InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import * as fs from "fs-extra";
import * as http from "http";
import {makeRoomsEntry} from "./InsightFacade";
const parse5 = require("parse5");

/**
 * Helper class to help parse and control datasets
 *
 */
// BELOW IS FROM IINSIGHT
// export interface InsightDataset {
//     id: string;
//     kind: InsightDatasetKind;
//     numRows: number;
// }
const path = __dirname + "/../../data/";
const geoURL = "http://cs310.ugrad.cs.ubc.ca:11316/api/v1/project_k7c1b_s7s0b/";

export default class DatasetController {
    private data: Map<string, any[]>;
    private insightData: Map<string, InsightDataset>;

    // constructor(private cache = false) {
    constructor() {
        Log.trace("DatasetController constuctor");
        // this.data = new Map<string, any[]>(this.checkCache());
        this.data = new Map<string, any[]>();
        this.insightData = new Map<string, InsightDataset>();
    }

    public addDataset(id: string, content: any[], kind: InsightDatasetKind) {
        Log.trace("CONTENT LENGTH " + content.length.toString());
        this.data.set(id, content);
        this.insightData.set(id, {id, kind, numRows: content.length});

        this.writeToCache(id);
    }

    public removeDataset(id: string) {
        this.data.delete(id);
        this.insightData.delete(id);
        fs.removeSync(path + "/" + id + ".json");    // remove from cache as well
        return true;
    }

    public getDataset(id: string): any[] {
        return this.data.get(id);
    }

    public containsDataset(id: string): boolean {
        return this.data.has(id);
    }

    public getAllDataKeys(): string[] {
        let r = [];
        for (let key of Array.from( this.data.keys()) ) { r.push(key); }
        return r;
    }

    private writeToCache(id: string) {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
        fs.writeFileSync(path + "/" + id + ".json", JSON.stringify(this.data.get(id)));
        Log.trace("WRITE TO CACHE!!! " + path + "/" + id + ".json");
    }

    public listDatasets(): InsightDataset[] {
        return Array.from(this.insightData.values());
    }
}
//////////////////
// HELPERS
export interface IGeoResponse {
    lat?: number;
    lon?: number;
    error?: string;
}

export function checkParsed(j: any): any {
    try {
        j = JSON.parse(j);
    } catch (error) {
        Log.error("ERROR CAUGHT");
        return null;
    }
    if (j && j.result && j.result.toString() !== "") { return j; }
    return null;
}

export function readBuildings(data: string): string[] {
    let doc = parse5.parse(data);
    let buildings = parseElements(doc, [{
        name: "class",
        value: "^(odd|even).*"
    }]);

    return buildings.map((child: any) => {
        let links = parseElements(child, [{
            name: "href",
            value: ".*"
        }]);

        for (let attr of links[0].attrs) {
            if (attr.name === "href") { return attr.value; }
        }
        throw new InsightError("can't find href"); // TODO
    });
}
export function parseElements(node: any, attributes: any[]): any {
    let matches: any = [];
    if (node == null) { return matches; }
    let e = node;
    if (e.attrs !== undefined) {
        if (hasMatchingAttributes(e, attributes)) {
            return [e];
        }
    }
    if (node.childNodes !== undefined) {
        for (let child of node.childNodes) {
            let matchingChildren = parseElements(child, attributes);
            matches.push(...matchingChildren); // ... spreads the object and overwrites as necessary
        }
    }
    return matches;
}
function hasMatchingAttributes(e: any, attributes: any[]): boolean {
    return attributes.every((attr) => {
        return e.attrs.some((elemAttr: any) => {
           return attr.name === elemAttr.name && elemAttr.value.search(attr.value) !== -1;
        });
    });
}

export function parseBuilding(id: string, b: string): Promise<any[]> {
        let doc = parse5.parse(b);
        const name = parseElements(doc, [{
            name: "rel",
            value: "canonical"
        }]);
        const rooms = parseElements(doc, [{
            name: "id",
            value: "^buildings-wrapper$"
        }]);
        const roomsInfo = parseElements(rooms[0], [{
            name: "class",
            value: "^field-content$"
        }]);

        const rShortname = name[0].attrs[1].value;
        const rFullname = (roomsInfo[0].childNodes[0]).value;
        const rAddress = (roomsInfo[1].childNodes[0]).value;
        const url = geoURL + encodeURI(rAddress);

        return Promise.resolve(httpGet(url)).then((geoResponse) => {
            let geo = geoResponse as IGeoResponse;
            try {
            if (typeof geoResponse.error === "string") {
                Log.trace("georesponse error");
                throw new InsightError(geoResponse.error);
            }

            return getRoomEntries(doc).map((room: any) => {
                const fields = parseElements(room, [{
                    name: "class",
                    value: "^views-field .*"
                }]);
                return makeRoomsEntry(id, fields, geo, rShortname, rFullname, rAddress);
            }).filter((entry: any) => {
                return Object.keys(entry).map((key) => entry[key])
                    .every((val) => val !== undefined);
            }); } catch (error) {
                return null;
            }
        });
}

export function httpGet(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            if (/^application\/json/.test(res.headers["content-type"])) {
                res.setEncoding("utf8");
                let data = "";
                res.on("error", (e) => reject(e));
                res.on("data", (section) => {
                    data += section;
                });
                res.on("end", () => {
                    data = data.trim();
                    try {
                        resolve(JSON.parse(data));
                    } catch (error) {
                        reject(error);
                    }
                });
            } else {
                const error = new Error("Request failed in httpGet");
                res.resume();
                reject(error);
            }
        }).on("error", (error: Error) => {
            Log.error(error.message);
            reject(error);
        });
    });
}

function getRoomEntries(doc: any): any {
    let rooms = parseElements(doc, [{
        name: "class",
        value: "^view view-buildings-and-classrooms view-id-buildings_and_classrooms .*"
    }]);
    return parseElements(rooms[0], [{
        name: "class",
        value: "^(odd|even).*"
    }]);
}
