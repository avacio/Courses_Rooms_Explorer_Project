import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import {expect} from "chai"; //
// import * as fs from "fs";
import * as fs from "fs-extra";
import chaiHttp = require("chai-http");
import Log from "../src/Util";

chai.use(chaiHttp);
const serverURL = "http://localhost:4321";
const path = __dirname + "/../test/data/";
// const path = __dirname + "/../../data/";

describe("Facade D3", function () {

    let facade: InsightFacade = null;
    let server: Server = null;

    chai.use(chaiHttp);

    before(function () {
        facade = new InsightFacade(); // TODO
        server = new Server(4321);
        // TODO: start server here once and handle errors properly
        // return server.start().then((resolve) => expect(resolve))
        //     .then(() => {
        //         return chai.request(serverURL).put("/dataset/courses")
        //             .attach("body", fs.readFileSync("test/data/courses.zip"), "courses.zip");
        //     });
        // return server.start();

        // Log.trace("path exists: " + fs.existsSync(path));
        // Log.trace("courses zip exists: " + fs.existsSync(path + "courses.zip"));
        // Server.initData().then(() => server.start())
        return server.start()
        .then((status) => {
            if (status) {
                Log.trace("Server start.");
            }
        }).catch((err: any) => {
            Log.trace("Server down: " + err);
        });
    });

    after(function () {
        // TODO: stop server here once!
        return server.stop();
        // return server.stop().then((resolve) => expect(resolve));
        // await server.stop().then((resolve) => expect(resolve));
        // return server.stop().then((status) => {
        //     if (status) { Log.trace("Server stopped."); }
        // });
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
        // might want to add some process logging here to keep track of what"s going on
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
        // might want to add some process logging here to keep track of what"s going on
    });

    // TODO: read your courses and rooms datasets here once!

    // Hint on how to test PUT requests
    it("PUT test for courses dataset", function () {
        try {
            // Log.trace(JSON.stringify(fs.readFileSync(path + "courses.zip")));
            return chai.request(serverURL)
                .put("/dataset/courses/courses")
                // .attach("body", YOUR_COURSES_DATASET, COURSES_ZIP_FILENAME)
                .attach("body", fs.readFileSync(path + "courses.zip"), "courses.zip")
                // .then(function (res: Response) {
                .then(function (res: any) {
                    // some logging here please!
                    Log.trace("Response: " + res.status);
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err: any) {
                    Log.trace("caught err: " + err);
                    expect.fail();
                });
        } catch (err) {
            expect.fail(err);
        }
    });
    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
    it("PUT test for rooms dataset", function () {
        try {
            return chai.request(serverURL)
                .put("/dataset/rooms/rooms")
                // .attach("body", YOUR_COURSES_DATASET, COURSES_ZIP_FILENAME)
                .attach("body", fs.readFileSync(path + "rooms.zip"), "rooms.zip")
                .then(function (res: any) {
                    Log.trace("Response: " + res.status);
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err: any) {
                    Log.trace("err: " + err);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            expect.fail(err);
        }
    });

    // it("PUT test: FAIL, unknown id", function () {
    //     try {
    //         return chai.request(serverURL)
    //             .put("/dataset/FAIL/rooms")
    //             .attach("body", fs.readFileSync(path + "courses.zip"), "courses.zip")
    //             .then(function (res: any) {
    //                 Log.trace("Response: " + res.status);
    //                 expect(res.status).to.be.equal(400);
    //             })
    //             .catch(function (err: any) {
    //                 Log.trace("err: " + err);
    //                 expect.fail();
    //             });
    //     } catch (err) {
    //         expect.fail(err);
    //     }
    // });

    it("PUT 200: the operation was successful and the id already existed", function () {
        this.timeout(20000);
        return chai.request(serverURL)
            .put("/dataset/courses/courses")
            .attach("body", fs.readFileSync(path + "courses.zip"), "courses.zip")
            .then((res) => {
                expect(res.status).to.eq(200);
            }, (err) => {
                expect.fail(err);
            });
    });

    // it("POST 200", function () {
    //     return chai.request(serverURL)
    //         .post("/query")
    //         .send({
    //             "WHERE":{
    //                 "GT":{
    //                     "courses_avg":97
    //                 }
    //             },
    //             "OPTIONS":{
    //                 "COLUMNS":[
    //                     "courses_dept",
    //                     "courses_avg"
    //                 ],
    //                 "ORDER":"courses_avg",
    //                 "FORM":"TABLE"
    //             }
    //         })
    //         .then(function (res: any) {
    //             Log.trace(res.body);
    //             expect(res.status).to.equal(200);
    //         })
    //         .catch(function (err:any) {
    //             Log.trace("catch:");
    //             Log.trace(err);
    //             // some assertions
    //             expect.fail();
    //         });
    // });

    it("POST 400", function () {
        return chai.request(serverURL)
            .post("/query")
            .send({})
            .then(function (res: any) {
                Log.trace("then: " + res);
                expect.fail();
            })
            .catch(function (err: any) {
                Log.trace("catch: " + err.body);
                expect(err.status).to.equal(400);
            });
    });

    it("GET 200", function () {
        return chai.request(serverURL)
            .get("/datasets")
            // .send({})
            .then(function (res: any) {
                Log.trace("then: " + JSON.stringify(res));
                expect(res.status).to.equal(200);
            });
    });

    it("PUT 400 with invalid kind", function () {
        this.timeout(20000);
        return chai.request(serverURL)
            .put("/dataset/rooms/fake")
            .attach("body", fs.readFileSync(path + "rooms.zip"), "rooms.zip")
            .then((res) => {
                expect.fail(res);
            }, (err) => {
                expect(err.status).to.eq(400);
                expect(Object.keys(err.response.body)).to.deep.eq(["error"]);
                expect(typeof err.response.body.error).to.eq("string");
            });
    });

    it("POST Should report missing datasets", () => {
        return chai.request(serverURL)
            .post("/query")
            .send({
                WHERE: {},
                OPTIONS: {
                    COLUMNS: ["fake_id"]
                }
            })
            .then((res) => {
                expect.fail(res);
            }, (err) => {
                expect(err.status).to.eq(400);
                // expect(err.response.body).to.deep.eq({
                //     missing: ["fake"]
                // });
            });
    });

    it("DEL 404 Should fail to remove unknown datasets", () => {
        return chai.request(serverURL)
            .del("/dataset/fake")
            .then((res) => {
                expect.fail(res);
            }, (err) => {
                expect(err.status).to.eq(404);
                expect(Object.keys(err.response.body)).to.deep.eq(["error"]);
                expect(typeof err.response.body.error).to.eq("string");
            });
    });

    // it("Should successfully post", () => {
    //     return chai.request(serverURL)
    //         .post("/query")
    //         .send({
    //             "WHERE": {
    //                 "AND": [
    //                     {"IS": {"courses_id": "317"}},
    //                     {"IS": {"courses_dept": "biol"}}
    //                 ]
    //             },
    //             "OPTIONS": {
    //                 "COLUMNS": ["courses_id", "courses_avg", "courses_dept"],
    //                 "ORDER": {"dir": "DOWN", "keys": ["courses_avg"]},
    //                 "FORM": "TABLE"
    //             }
    //         })
    //         .then((res) => {
    //             expect(res.status).to.eq(200);
    //             expect(res.body).to.deep.eq({"render":"TABLE","result":[{"courses_id":"317",
    //             courses_avg":72.73,"courses_dept":"biol"},{"courses_id":"317",
    //             "courses_avg":72.73,"courses_dept":"biol"},{"courses_id":"317","courses_avg":72.5,
    //             "courses_dept":"biol"},{"courses_id":"317","courses_avg":72.5,"courses_dept":"biol"},
    //             {"courses_id":"317","courses_avg":70.83,"courses_dept":"biol"},{"courses_id":"317","courses_avg":
    //             70.83,"courses_dept":"biol"},{"courses_id":"317","courses_avg":70.78,"courses_dept":"biol"},
    //             {"courses_id":"317","courses_avg":70.78,"courses_dept":"biol"},{"courses_id":"317","courses_avg"
    //             :69.57,"courses_dept":"biol"},{"courses_id":"317","courses_avg":69.57,"courses_dept":"biol"},{
    //             "courses_id":"317","courses_avg":69.35,"courses_dept":"biol"},{"courses_id":"317","
    //             courses_avg":69.35,"courses_dept":"biol"},{"courses_id":"317","courses_avg":69.1,"courses_dept"
    //             :"biol"},{"courses_id":"317","courses_avg":69.1,"courses_dept":"biol"},{"courses_id":"317",
    //             "courses_avg":65.24,"courses_dept":"biol"},{"courses_id":"317","courses_avg":65.24,
    //             "courses_dept":"biol"}]})
    //         }, (err) => {
    //             // some assertions
    //             expect.fail(err);
    //         });
    // });

    it("DEL 200 courses", function () {
        return chai.request(serverURL)
            .del("/dataset/courses")
            .then(function (res: any) {
                Log.trace("res: " + JSON.stringify(res));
                expect(res.status).to.equal(200);
            })
            .catch(function (err: any) {
                Log.trace("catch:" + err);
                expect.fail();
            });
    });

    it("DEL 200 rooms", function () {
        return chai.request(serverURL)
            .del("/dataset/rooms")
            .then(function (res: any) {
                Log.trace("res: " + JSON.stringify(res));
                expect(res.status).to.equal(200);
            })
            .catch(function (err: any) {
                Log.trace("catch:" + err);
                // expect.fail();
            });
    });

    it("DEL 404 rooms -- already deleted before", function () {
        return chai.request(serverURL)
            .del("/dataset/rooms")
            .then(function (res: any) {
                Log.trace(res);
                expect(res.status).to.equal(404);
            })
            .catch(function (err: any) {
                Log.trace("catch:" + err);
                expect(err.status).to.equal(404);
                // expect.fail();
            });
    });
});
