import Log from "../Util";
import {InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import * as fs from "fs-extra";
import * as http from "http";
import * as parse5 from "parse5/lib";
// export const parse5 = require("parse5");
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
        const entries: any[] = [];
        this.data.forEach(async function (value, key) { // needs to be async or no?
            entries.push(value);
        });
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
        fs.writeFileSync(path + "/" + id + ".json", JSON.stringify(entries)); // TODO
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

export function checkParsed(j: any): any { // TODO: being used?
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
    let doc = parse5.parse(data) as parse5.AST.Default.Document;
    let buildings = parseElements(doc, [{
        name: "class",
        value: "^(odd|even).*"
    }]);

    return buildings.map((child) => {
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

export function parseElements(node: parse5.AST.Default.ParentNode, attributes: any[]): parse5.AST.Default.Element[] {
    let matches = [];
    let e = node as parse5.AST.Default.Element;

    if (e.attrs !== null) {
        if (hasMatchingAttributes(e, attributes)) {
            return [e];
        }
    }
    if (node.childNodes !== null) {
        for (let child of node.childNodes) {
            let matchingChildren = parseElements(child as parse5.AST.Default.Element, attributes);
            matches.push(...matchingChildren); // ... spreads the object and overwrites as necessary
        }
    }
    return matches;
}

// TODO
function hasMatchingAttributes(e: parse5.AST.Default.Element, attributes: any[]): boolean {
    return attributes.every((attr) => {
       return e.attrs.some((elemAttr: any) => {
           return attr.name === elemAttr.name && elemAttr.value.search(attr.value) !== -1; });
    });
}
////////////////////////
// export function processElement(node: any, id: string): Object {
//     let str = "";
//     let result = {};
//
// }
////////////////////////
export function parseBuilding(id: string, b: string): Promise<any[]> {
    try {
        let doc = parse5.parse(b) as parse5.AST.Default.Document;
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
        const rFullname = (roomsInfo[0].childNodes[0] as parse5.AST.Default.TextNode).value;
        const rAddress = (roomsInfo[1].childNodes[0] as parse5.AST.Default.TextNode).value;
        const url = geoURL + encodeURI(rAddress);

        // TODO
        return Promise.resolve(httpGet(url)).then((geoResponse) => {
            let geo = geoResponse as IGeoResponse;
            return getRoomEntries(doc).map((room) => {
                const fields = parseElements(room, [{
                    name: "class",
                    value: "^views-field .*"
                }]);
                return makeRoomsEntry(id, fields, geo, rShortname, rFullname, rAddress);
            }).filter((entry) => {
                return Object.keys(entry).map((key) => entry[key])
                    .every((val) => val !== null);
            });
        });
    } catch (error) {
        throw new InsightError("parseBuilding");
    }
}

export function httpGet(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = "";
            res.on("data", (section) => {
                data += section;
            });
            res.on("end", () => {
                data = data.trim();
                // let r: IGeoResponse = {};
                //
                // const latIndex = body.indexOf("\"lat\":");
                // const lonIndex = body.indexOf("\"lon\":");
                // const errorIndex = body.indexOf("\"error\":");
                // if (latIndex > -1) {
                //     r.lat = parseFloat(body.substring(latIndex + 6, body.indexOf(",")));
                // }
                // if (lonIndex > -1) {
                //     r.lon = parseFloat(body.substring(lonIndex + 6, body.indexOf("}")));
                // }
                // if (errorIndex > -1) {
                //     r.error = body.substring(body.indexOf(":") + 2, body.indexOf("}") - 1);
                // }
                //// resolve(res);
                // resolve(r);
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    reject(error);
                }
            });
        }).on("error", (e: Error) => {
            Log.error(e.message);
            reject(e);
        });
    });
}

function getRoomEntries(doc: parse5.AST.Default.Document): parse5.AST.Default.ParentNode[] {
    let rooms = parseElements(doc, [{
        name: "class",
        value: "^view view-buildings-and-classrooms view-id-building_and_classrooms .*"
    }]);
    return parseElements(rooms[0], [{
        name: "class",
        value: "^(odd|even).*"
    }]);
}

function makeRoomsEntry(id: string, fields: parse5.AST.Default.Element[], geo: IGeoResponse, rShortname: string,
                        rFullname: string, rAddress: string): any {
    // TODO
    const roomsNum = ((fields[0].childNodes[1] as parse5.AST.Default.Element)
        .childNodes[0] as parse5.AST.Default.TextNode).value.trim();
    let entry: any = {};

    entry[id + "_fullname"] = rFullname;
    entry[id + "_shortname"] = rShortname;
    entry[id + "_number"] = roomsNum;
    entry[id + "_name"] = rShortname + "_" + roomsNum;
    entry[id + "_address"] = rAddress;
    entry[id + "_lat"] = geo.lat;
    entry[id + "_lon"] = geo.lon;
    entry[id + "_seats"] = parseInt((fields[1].childNodes[0] as parse5.AST.Default.TextNode).value.trim(), 10);
    entry[id + "_type"] = (fields[3].childNodes[0] as parse5.AST.Default.TextNode).value.trim();
    entry[id + "_furniture"] = (fields[2].childNodes[0] as parse5.AST.Default.TextNode).value.trim();
    entry[id + "_href"] = (fields[0].childNodes[1] as parse5.AST.Default.Element).attrs[0].value;
    return entry;
}
