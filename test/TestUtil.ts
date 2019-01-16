import * as fs from "fs";
import * as fspath from "path";
import * as recursive from "recursive-readdir";

import Log from "../src/Util";
import { ITestQuery } from "./InsightFacade.spec";

export default class TestUtil {

    /**
     * Wraps readFile in a promise.
     * @param path The location of the file to read.
     * @returns A buffer containing the contents of the file.
     */
    public static readFileAsync(path: string): Promise<Buffer> {
        return new Promise<Buffer>((resolve, reject) => {
            fs.readFile(path, (err, data) => {
                if (err) {
                    reject(err);
                }

                resolve(data);
            });
        });
    }

    /**
     * Recursively searches for test query JSON files in the path and returns those matching the specified schema.
     * @param path The path to the sample query JSON files.
     */
    public static async readTestQueries(path: string = "test/queries"): Promise<ITestQuery[]> {
        const methodName: string = "TestUtil::readTestQueries --";
        const extName: string = ".json";
        const testQueries: ITestQuery[] = [];
        let files: string[];

        try {
            const allFiles = await recursive(path);
            files = allFiles.filter((p) => fspath.extname(p) === extName);
            if (files.length === 0) {
                Log.warn(`${methodName} No query files found in ${path}.`);
            }
        } catch (err) {
            Log.error(`${methodName} Exception reading files in ${path}.`);
            throw err;
        }

        for (const file of files) {
            const skipFile: string = file.replace(__dirname, "test");
            let content: Buffer;

            try {
                content = await TestUtil.readFileAsync(file);
            } catch (err) {
                Log.error(`${methodName} Could not read ${skipFile}.`);
                throw err;
            }

            try {
                const query = JSON.parse(content.toString());
                TestUtil.validate(query, {title: "string", query: null, isQueryValid: "boolean", result: null});
                query["filename"] = file;
                testQueries.push(query);
            } catch (err) {
                Log.error(`${methodName} ${skipFile} does not conform to the query schema.`);
                throw new Error(`In ${file} ${err.message}`);
            }
        }

        return testQueries;
    }

    private static validate(content: any, schema: {[key: string]: string}) {
        for (const [property, type] of Object.entries(schema)) {
            if (!content.hasOwnProperty(property)) {
                throw new Error(`required property ${property} is missing.`);
            } else if (type !== null && typeof content[property] !== type) {
                throw new Error(`the value of ${property} is not ${type === "object" ? "an" : "a"} ${type}.`);
            }

        }
    }
}
