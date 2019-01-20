import Log from "../Util";
/**
 * Helper class to help parse and control datasets
 *
 */
export default class DatasetController {
    private data: Map<string, any[]>;

    constructor() {
        Log.trace("DatasetController constuctor");
        this.data = new Map<string, any[]>();
    }

    // returns false if id is null
    public addDataset(id: string, content: any[]): boolean {
        // if (this.data.containsDataset(id)) {
        if (id != null) {
            this.data.set(id, content);
            return true;
        }
        return false;
    }

    // returns false if id is null
    public removeDataset(id: string): boolean {
        // if (this.data.containsDataset(id)) {
        if (id != null) {
            this.data.delete(id);
            return true;
        }
        return false;
    }

    public containsDataset(id: string): boolean {
        return this.data.has(id);
    }

    public getDataset(id: string): any[] {
        return this.data.get(id);
    }

    ///// TODO: Add cache stuff
} //// TODO: parsing
//
// export const datasetTraits: {
//     [dataset: string] {
//         processZip: (zip:JSZip) => Promise<any[]>,
//         keys: {
//
//         }
// }
// }
