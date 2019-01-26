import Query from "./Query";

export class QueryResult {
    constructor(query: Query, dataset: string) {
        //
        dataset = "";
    }
}

export default class QueryController {
    // constructor() {}

    public static isValidQuery(q: any): boolean {
        if (q === null) {
            return false;
        }

        let keys = Object.keys(q);
        if (keys.length !== 2) {
            return false;
        }

        // OPTIONS FORMAT
        const opts = q.OPTIONS;
        if (opts === null || !Array.isArray(opts.COLUMNS)
            || opts.COLUMNS.length < 1 || opts.length > 2
            || opts.COLUMNS.some((e: any) => typeof e !== "string")) {
            return false;
        }

        return true;
    }

    // assume query is valid
    public parseQuery(q: any): QueryResult {
        const query = new Query(q.WHERE, q.OPTIONS);
        // TODO
        return new QueryResult(null, ""); // STUB
    }
}
