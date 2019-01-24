export default class QueryController {
    constructor(
        public OPTIONS: QueryOptions
    ) {}

    public isValidQuery(q: any): boolean {
        if (q === null) { return false; }

        let keys = Object.keys(q);
        if (keys.length !== 2) { return false; }

        // OPTIONS FORMAT
        const opts = q.OPTIONS;
        if (opts === null || !Array.isArray(opts.COLUMNS)
        || opts.COLUMNS.length < 1 || opts.length > 2
        || opts.COLUMNS.some((e: any) => typeof e !== "string")) {
            return false;
        }

        return true;
    }

}

interface QueryOptions {
    COLUMNS: string[];
    ORDER?: string; // ORDER IS NOT NECESSARY IN A QUERY
}
