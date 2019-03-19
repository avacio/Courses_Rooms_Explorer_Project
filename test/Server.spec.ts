import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import {expect} from "chai"; //
// import * as fs from "fs";
import * as fs from "fs-extra";

import chaiHttp = require("chai-http");
import Response = ChaiHttp.Response;
import Log from "../src/Util"; //

chai.use(chaiHttp);
const serverURL = "http://localhost:4321";

describe("Facade D3", function () {

    let facade: InsightFacade = null;
    let server: Server = null;

    chai.use(chaiHttp);

    before(function () {
        facade = new InsightFacade();
        server = new Server(4321);
        // TODO: start server here once and handle errors properly
        // return server.start().then((resolve) => expect(resolve))
        //     .then(() => {
        //         return chai.request(serverURL).put("/dataset/courses")
        //             .attach("body", fs.readFileSync("test/data/courses.zip"), "courses.zip");
        //     });
        // return server.start();
        return server.start().then((status) => {
            if (status) {
                Log.trace("Server start.");
            }
        }).catch((err: any) => {
            Log.trace("Server down: " + err);
        });
    });

    after(function () {
        // TODO: stop server here once!
        // return server.stop().then((resolve) => expect(resolve));
        return server.stop().then((status) => {
            if (status) { Log.trace("Server stopped."); }
        });
    });

    beforeEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    // TODO: read your courses and rooms datasets here once!

    // Hint on how to test PUT requests
    it("PUT test for courses dataset", function () {
        try {
            return chai.request(serverURL)
                .put("/dataset/courses")
                // .attach("body", YOUR_COURSES_DATASET, COURSES_ZIP_FILENAME)
                .attach("body", fs.readFileSync("./test/data/courses.zip"), "courses.zip")
                // .then(function (res: Response) {
                .then(function (res: any) {
                    // some logging here please!
                    Log.trace("Response: " + res.status);
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err: any) {
                    Log.trace("err: " + err);
                    // some logging here please!
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            expect.fail(err);
        }
    });
    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
    it("PUT test for rooms dataset", function () {
        try {
            return chai.request(serverURL)
                .put("/dataset/rooms")
                // .attach("body", YOUR_COURSES_DATASET, COURSES_ZIP_FILENAME)
                .attach("body", fs.readFileSync("./test/data/rooms.zip"), "rooms.zip")
                // .then(function (res: Response) {
                .then(function (res: any) {
                    // some logging here please!
                    Log.trace("Response: " + res.status);
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err: any) {
                    Log.trace("err: " + err);
                    // some logging here please!
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            expect.fail(err);
        }
    });

    it("PUT test: FAIL", function () {
        try {
            return chai.request(serverURL)
                .put("/dataset/FAIL")
                .attach("body", fs.readFileSync("./test/data/courses.zip"), "courses.zip")
                .then(function (res: any) {
                    Log.trace("Response: " + res.status);
                    expect(res.status).to.be.equal(400);
                })
                .catch(function (err: any) {
                    Log.trace("err: " + err);
                    // some logging here please!
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            expect.fail(err);
        }
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
    it("DEL 204", function () {
        return chai.request(serverURL)
            .del("/dataset/rooms")
            .then(function (res: any) {
                Log.trace(res);
                expect(res.status).to.equal(200);
            })
            .catch(function (err: any) {
                Log.trace("catch:");
                expect.fail();
            });
    });

    it("DEL 204", function () {
        return chai.request(serverURL)
            .del("/dataset/courses")
            .then(function (res: any) {
                expect(res.status).to.equal(200);
            })
            .catch(function (err: any) {
                Log.trace("catch:");
                expect.fail();
            });
    });
});
