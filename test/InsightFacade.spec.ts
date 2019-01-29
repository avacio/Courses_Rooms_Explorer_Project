import { expect } from "chai";
import * as fs from "fs-extra"; // * = modules

import {
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
    ResultTooLargeError
} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string;  // This is injected when reading the file
}

describe("InsightFacade Add/Remove Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the Before All hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        crwr: "./test/data/crwr.zip",
        allInvalidJSON: "./test/data/allInvalidJSON.zip",
        allNotJSON: "./test/data/allNotJSON.zip",
        lastNotJSON: "./test/data/lastNotJSON.zip",
        firstNotJSON: "./test/data/firstNotJSON.zip",
        midNotJSON: "./test/data/midNotJSON.zip",
        nestedFolder: "./test/data/nestedFolder.zip",
        someInvalidJSON: "./test/data/someInvalidJSON.zip",
        someNotJSON: "./test/data/someNotJSON.zip",
        wrongName: "./test/data/wrongName.zip",
        // crwrNotZipped: "./test/data/crwrNotZipped/", // TODO
        // unzipped: "./test/data/unzipped/" // TODO
        // unzipped: "./test/data/unzipped.zip" // TODO
    };

    let insightFacade: InsightFacade;
    let datasets: { [id: string]: string };

    before(async function () {
        Log.test(`Before: ${this.test.parent.title}`);
        fs.removeSync("./data");    // remove from cache as well TODO

        try {
            const loadDatasetPromises: Array<Promise<Buffer>> = [];
            for (const [id, path] of Object.entries(datasetsToLoad)) {
                loadDatasetPromises.push(TestUtil.readFileAsync(path));
            }
            const loadedDatasets = (await Promise.all(loadDatasetPromises)).map((buf, i) => {
                return { [Object.keys(datasetsToLoad)[i]]: buf.toString("base64") };
            });
            datasets = Object.assign({}, ...loadedDatasets);
            expect(Object.keys(datasets)).to.have.length.greaterThan(0);
        } catch (err) {
            expect.fail("", "", `Failed to read one or more datasets. ${JSON.stringify(err)}`);
        }
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);

        try {
            // fs.removeSync("./data");    // remove from cache as well TODO
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        } finally {
            expect(insightFacade).to.be.instanceOf(InsightFacade);
        }
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
        Log.test("map size: " + insightFacade.getMapCount());
        insightFacade.printKeys();
        // Log.test("datapool size: " + insightFacade.getDataPool().size); // TODO TESTING
        // insightFacade.getDataPool().forEach((value: any, key: string) => {
        //     Log.test(key + value.toString());
        // });
    });

    it("Should add a valid dataset", async function () {
        const id: string = "courses";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal([id]);
        }
    });

    // This is an example of a pending test. Add a callback function to make the test run.
    it("Should remove the courses dataset", async function () {
        const id: string = "courses";
        let response: string;

        try {
            await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal(id);
        }
    });

    it("Should add the valid 'crwr' dataset", async function () {
        const id: string = "crwr";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal([id]);
        }
    });

    it("Should remove the crwr dataset", async function () {
        const id: string = "crwr";
        let response: string;

        try {
            await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal(id);
        }
    });

    it("Should not be able to add an invalid dataset -- zip file directory is not named 'courses", async function () {
        const id: string = "wrongName";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            // expect(response).to.deep.equal(new InsightError("REJECTED addDataset,
            // allData insignificant: wrongName"));
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Should not be able to add an invalid dataset -- zip file does not exist", async function () {
        const id: string = "invalid";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            // expect(response).to.deep.equal([id]);
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Should not be able to add an invalid dataset -- empty string", async function () {
        const id: string = "";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            // expect(response).to.deep.equal([id]);
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Should not be able to add an invalid dataset -- called dataset is not zipped", async function () {
        const id: string = "crwrNotZipped";
        let response: string[];
        // const id: string = fs.readFileSync("./test/data/crwrNotZipped").toString("base64");

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Should not be able to add dataset -- called dataset is not zipped, no subdirectory", async function () {
        const id: string = "unzipped";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Should not be able to add an invalid dataset -- no courses are in JSON format", async function () {
        const id: string = "allNotJSON";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Should be able to add dataset -- some courses are not in JSON format, but some are valid", async function () {
        const id: string = "someNotJSON";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal([id]);
        }
    });

    it("Should not be able to add a dataset -- mix no valid course sect, last not JSON format", async function () {
        const id: string = "lastNotJSON";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            // expect(response).to.deep.equal([id]);
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Should be able to add a dataset -- all but first course is in JSON format", async function () {
        const id: string = "firstNotJSON";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal([id]);
        }
    });

    it("Should not be able to add a dataset -- invalid JSON format, not JSON files", async function () {
        const id: string = "invalidAndNotJSON";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Should be able to add a dataset -- some invalid JSON format, rest valid", async function () {
        const id: string = "someInvalidJSON";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal([id]);
        }
    });

    it("Should not be able to add a dataset -- all invalid JSON format", async function () {
        const id: string = "allInvalidJSON";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Should be able to add a dataset -- all but middle course is in JSON format", async function () {
        const id: string = "firstNotJSON";
        let response: string[];
        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal([id]);
        }
    });

    it("Should not be able to add a dataset with nested folders", async function () {
        const id: string = "nestedFolder";
        let response: string[];
        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Should not be able to add the same dataset twice", async function () {
        const id: string = "crwr";
        let response: string[];

        // TODO
        try {
            await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Should not be able to remove a dataset that does not exist", async function () {
        const id: string = "invalid";
        let response: string;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(NotFoundError);
        }
    });

    it("Should not be able to remove a dataset that has not yet been added", async function () {
        const id: string = "courses";
        let response: string;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(NotFoundError);
        }
    });

    it("Should not be able to remove a dataset -- empty string", async function () {
        const id: string = "";
        let response: string;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(NotFoundError);
        }
    });

    it("testing listDatasets() after successful add", async function () {
        const id: string = "courses";
        let response: string[];
        let dataSetsResult: Promise<InsightDataset[]>;
        let listedData: InsightDataset[];
        // todo
        // try {
        //     dataSetsResult = insightFacade.listDatasets();
        //     listedData = await Promise.resolve(dataSetsResult);
        //     expect(listedData.length).to.deep.equal(0);
        //     response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        //     await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        //     dataSetsResult = insightFacade.listDatasets();
        // } catch (err) {
        //     response = err;
        // } finally {
        //     expect(await Promise.resolve(dataSetsResult).length).to.deep.include([id]);
        // }

        let num: number;
        try {
            // Promise.each(insightFacade.listDatasets())
            // insightFacade.listDatasets().then((result) => {
            //     Log.trace(result.length.toString());
            //     num = result.length; });

            // PRINT STATEMENTS
            // insightFacade.listDatasets();
        // NUMROWS SHOULD 64612
            // CURRENTLY 3589
            await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
            return insightFacade.listDatasets();

        } catch (err) {
            //     response = err;
            } finally {
                // expect(num).to.deep.equal(64612);
            }
    });

    it("testing listDatasets() after remove", async function () {
        const id: string = "courses";
        let response: string[]; // TODO: response necessary?
        let dataSetsResult: Promise<InsightDataset[]>;
        let listedData: InsightDataset[];

        try {
            dataSetsResult = insightFacade.listDatasets();
            listedData = await Promise.resolve(dataSetsResult);
            expect(listedData.length).to.deep.equal(0);

            await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
            dataSetsResult = insightFacade.listDatasets();
            listedData = await Promise.resolve(dataSetsResult);
            expect(listedData.length).to.deep.equal(1);
            expect(dataSetsResult).to.deep.include([id]);

            await insightFacade.removeDataset(id);
            dataSetsResult = insightFacade.listDatasets();
        } catch (err) {
            response = err;
        } finally {
            listedData = await Promise.resolve(dataSetsResult);
            expect(listedData.length).to.deep.equal(0);
        }
    });

    it("testing listDatasets() after successful remove", async function () {
        const id: string = "courses";
        let response: string[]; // TODO: response necessary?
        let dataSetsResult: Promise<InsightDataset[]>;
        let listedData: InsightDataset[];

        try {
            dataSetsResult = insightFacade.listDatasets();
            listedData = await Promise.resolve(dataSetsResult);
            expect(listedData.length).to.deep.equal(0);

            await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
            dataSetsResult = insightFacade.listDatasets();
            listedData = await Promise.resolve(dataSetsResult);
            expect(listedData.length).to.deep.equal(1);
            expect(dataSetsResult).to.deep.include([id]);

            await insightFacade.removeDataset(id);
            dataSetsResult = insightFacade.listDatasets();
            listedData = await Promise.resolve(dataSetsResult);
            expect(listedData.length).to.deep.equal(0);

            await insightFacade.addDataset("crwr", datasets["crwr"], InsightDatasetKind.Courses);
            dataSetsResult = insightFacade.listDatasets();
        } catch (err) {
            response = err;
        } finally {
            listedData = await Promise.resolve(dataSetsResult);
            expect(listedData.length).to.deep.equal(1);
        }
    });

    it("testing listDatasets() after add/remove of the same set twice", async function () {
        const id: string = "crwr";
        let response: string[]; // TODO: response necessary?
        let dataSetsResult: Promise<InsightDataset[]>;
        let listedData: InsightDataset[];

        try {
            dataSetsResult = insightFacade.listDatasets();
            listedData = await Promise.resolve(dataSetsResult);
            expect(listedData.length).to.deep.equal(0);

            await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
            await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
            dataSetsResult = insightFacade.listDatasets();
            expect(dataSetsResult).to.deep.include([id]);
            listedData = await Promise.resolve(dataSetsResult);
            expect(listedData.length).to.deep.equal(2);

            await insightFacade.removeDataset(id);  // if same id will it remove both, or one set?
            dataSetsResult = insightFacade.listDatasets();
        } catch (err) {
            response = err;
        } finally {
            listedData = await Promise.resolve(dataSetsResult);
            expect(listedData.length).to.deep.equal(1);
        }
    });
});

// This test suite dynamically generates tests from the JSON files in test/queries.
// You should not need to modify it; instead, add additional files to the queries directory.
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];

    // Create a new instance of InsightFacade, read in the test queries from test/queries and
    // add the datasets specified in datasetsToQuery.
    before(async function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = await TestUtil.readTestQueries();
            expect(testQueries).to.have.length.greaterThan(0);
        } catch (err) {
            expect.fail("", "", `Failed to read one or more test queries. ${err}`);
        }

        try {
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        } finally {
            expect(insightFacade).to.be.instanceOf(InsightFacade);
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Fail if there is a problem reading ANY dataset.
        try {
            const loadDatasetPromises: Array<Promise<Buffer>> = [];
            for (const [id, path] of Object.entries(datasetsToQuery)) {
                loadDatasetPromises.push(TestUtil.readFileAsync(path));
            }
            const loadedDatasets = (await Promise.all(loadDatasetPromises)).map((buf, i) => {
                return { [Object.keys(datasetsToQuery)[i]]: buf.toString("base64") };
            });
            expect(loadedDatasets).to.have.length.greaterThan(0);

            const responsePromises: Array<Promise<string[]>> = [];
            const datasets: { [id: string]: string } = Object.assign({}, ...loadedDatasets);
            for (const [id, content] of Object.entries(datasets)) {
                responsePromises.push(insightFacade.addDataset(id, content, InsightDatasetKind.Courses));
            }

            // This try/catch is a hack to let your dynamic tests execute even if the addDataset method fails.
            // In D1, you should remove this try/catch to ensure your datasets load successfully before trying
            // to run you queries.
            try {
                const responses: string[][] = await Promise.all(responsePromises);
                responses.forEach((response) => expect(response).to.be.an("array"));
            } catch (err) {
                Log.warn(`Ignoring addDataset errors. For D1, you should allow errors to fail the Before All hook.`);
            }
        } catch (err) {
            expect.fail("", "", `Failed to read one or more datasets. ${JSON.stringify(err)}`);
        }
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // // Dynamically create and run a test for each query in testQueries
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, async function () {
                    let response: any[];

                    try {
                        response = await insightFacade.performQuery(test.query);
                    } catch (err) {
                        response = err;
                    } finally {
                        if (test.isQueryValid) {
                            expect(response).to.deep.equal(test.result);
                        } else {
                            switch (test.result) {
                                case "InsightError":
                                    expect(response).to.be.instanceOf(InsightError);
                                    break;
                                case "ResultTooLarge":
                                    expect(response).to.be.instanceOf(ResultTooLargeError);
                                    break;
                            }
                        }
                    }
                });
            }
        });
    });
});
