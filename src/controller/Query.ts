export default class Query {
    constructor(
        public WHERE: Filter, // TODO
        public OPTIONS: IQueryOptions,
    ) {}

}

enum Filter { IS, NOT, EQ, LT, GT, AND, OR }

interface IQueryOptions {
    COLUMNS: string[];
    ORDER?: string; // ORDER IS NOT NECESSARY IN A QUERY
}
