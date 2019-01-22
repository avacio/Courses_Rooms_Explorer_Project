import {InsightDatasetKind} from "./IInsightFacade";
import * as JSZip from "jszip";

export class Dataset {
    private id: string;
    private content: any[];
    private kind: InsightDatasetKind;
    private numRows: number; // the number of entries in the dataset,
                            // so the sum of all sections of every course in a given dataset

    private contentAsString: string;

    constructor(id: string, content: string, kind: InsightDatasetKind) {
        this.id = id;
        this.content = []; // or parse here?
        this.kind = kind;
        this.numRows = 0; // STUB

        this.contentAsString = content;
    }

    public read(): Promise<any[]> {
        const self = this;
        return new Promise(async function (resolve, reject) {
            let zip = new JSZip();
            let allData: string[] = [];
            let promises: any[] = [];

            try {
                let z = await zip.loadAsync(self.contentAsString, {base64: true}); // TODO
                z.forEach(async function (path: string, file: any) {
                    if (file.dir) {
                        return;
                    }
                    let result = await z.file(path).async("text");
                    let resultParsed = await JSON.stringify(JSON.parse(result));
                    await allData.push(resultParsed);
                });

                await Promise.all(promises);
                resolve(allData);
            } catch (error) {
                reject("rejected");
            } finally {
                self.content = promises; // TODO
            }
        });
    }
}
