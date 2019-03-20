/**
 * Created by rtholmes on 2016-06-19.
 */

import fs = require("fs");
import restify = require("restify");
import Log from "../Util";
import ServerController from "./ServerController";
import {InsightDatasetKind, NotFoundError} from "../controller/IInsightFacade";
import InsightFacade from "../controller/InsightFacade";

/**
 * This configures the REST endpoints for the server.
 */
export default class Server {

    private port: number;
    private rest: restify.Server;
    // private inf: InsightFacade;
    // private static inf: InsightFacade;

    constructor(port: number) {
        Log.info("Server::<init>( " + port + " )");
        this.port = port;
        // this.inf = new InsightFacade();
    }

    public static initData(): Promise<any> {
        return ServerController.initData();
        // const courses = fs.readFileSync(__dirname + "/../../test/data/courses.zip").toString("base64");
        // const rooms = fs.readFileSync(__dirname + "/../../test/data/rooms.zip").toString("base64");
        //
        // // Log.trace("initData courses: " + JSON.stringify(courses));
        // // return this.inf.addDataset("courses", courses, InsightDatasetKind.Courses)
        // return this.inf.addDataset("courses", courses, InsightDatasetKind.Courses)
        //     .then(() => this.inf.addDataset("rooms", rooms, InsightDatasetKind.Rooms));
    }

    /**
     * Stops the server. Again returns a promise so we know when the connections have
     * actually been fully closed and the port has been released.
     *
     * @returns {Promise<boolean>}
     */
    public stop(): Promise<boolean> {
        Log.info("Server::close()");
        const that = this;
        return new Promise(function (fulfill) {
            that.rest.close(function () {
                fulfill(true);
            });
        });
    }

    /**
     * Starts the server. Returns a promise with a boolean value. Promises are used
     * here because starting the server takes some time and we want to know when it
     * is done (and if it worked).
     *
     * @returns {Promise<boolean>}
     */
    public start(): Promise<boolean> {
        const that = this;
        return new Promise(function (fulfill, reject) {
            try {
                Log.info("Server::start() - start");

                that.rest = restify.createServer({
                    name: "insightUBC",
                });
                that.rest.use(restify.bodyParser({mapFiles: true, mapParams: true}));
                that.rest.use(
                    function crossOrigin(req, res, next) {
                        res.header("Access-Control-Allow-Origin", "*");
                        res.header("Access-Control-Allow-Headers", "X-Requested-With");
                        return next();
                    });

                // This is an example endpoint that you can invoke by accessing this URL in your browser:
                // http://localhost:4321/echo/hello
                that.rest.get("/echo/:msg", Server.echo);

                // NOTE: your endpoints should go here TODO
                // that.rest.get("/public/.*", restify)
                that.rest.get("/public/.*", restify.serveStatic({
                    directory: __dirname
                }));
                that.rest.put("/dataset/:id/:kind", ServerController.putDataset);
                that.rest.del("/dataset/:id", ServerController.deleteDataset);
                that.rest.post("/query", restify.bodyParser(), ServerController.postQuery);
                that.rest.get("/datasets", ServerController.getDatasets);
                // that.rest.put("/dataset/:id/:kind", Server.putDataset);
                // that.rest.del("/dataset/:id", Server.deleteDataset);
                // that.rest.post("/query", restify.bodyParser(), Server.postQuery);
                // that.rest.get("/datasets", Server.getDatasets);

                // This must be the last endpoint!
                that.rest.get("/.*", Server.getStatic);

                that.rest.listen(that.port, function () {
                    Log.info("Server::start() - restify listening: " + that.rest.url);
                    fulfill(true);
                });

                that.rest.on("error", function (err: string) {
                    // catches errors in restify start; unusual syntax due to internal
                    // node not using normal exceptions here
                    Log.info("Server::start() - restify ERROR: " + err);
                    reject(err);
                });

            } catch (err) {
                Log.error("Server::start() - ERROR: " + err);
                reject(err);
            }
        });
    }

    // The next two methods handle the echo service.
    // These are almost certainly not the best place to put these, but are here for your reference.
    // By updating the Server.echo function pointer above, these methods can be easily moved.
    private static echo(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("Server::echo(..) - params: " + JSON.stringify(req.params));
        try {
            const response = Server.performEcho(req.params.msg);
            Log.info("Server::echo(..) - responding " + 200);
            res.json(200, {result: response});
        } catch (err) {
            Log.error("Server::echo(..) - responding 400");
            res.json(400, {error: err});
        }
        return next();
    }

    private static performEcho(msg: string): string {
        if (typeof msg !== "undefined" && msg !== null) {
            return `${msg}...${msg}`;
        } else {
            return "Message not provided";
        }
    }

    private static getStatic(req: restify.Request, res: restify.Response, next: restify.Next) {
        const publicDir = "frontend/public/";
        Log.trace("RoutHandler::getStatic::" + req.url);
        let path = publicDir + "index.html";
        if (req.url !== "/") {
            path = publicDir + req.url.split("/").pop();
        }
        fs.readFile(path, function (err: Error, file: Buffer) {
            if (err) {
                res.send(500);
                Log.error(JSON.stringify(err));
                return next();
            }
            res.write(file);
            res.end();
            return next();
        });
    }

    // private static putDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
    //     Log.trace("in putDataset");
    //     const data = new Buffer(req.params.body).toString("base64");
    //     const id = req.params.id;
    //     const kind = req.params.kind;
    //     let insightKind = (kind === "courses") ? InsightDatasetKind.Courses :
    //         ((kind === "rooms") ? InsightDatasetKind.Rooms : kind);
    //
    //     Log.trace("insight kind for PUT: " + insightKind.toString());
    //
    //     this.inf.addDataset(id, data, insightKind).then (function (r: any) {
    //         res.json(200, {result: r});
    //     }).catch(function (e: any) {
    //         res.json(400, {error: e.message});
    //     });
    //     return next();
    // }
    //
    // private static deleteDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
    //     Log.trace("in deleteDataset");
    //     try {
    //         const id = req.params.id;
    //         Log.trace("id: " + id);
    //         this.inf.removeDataset(id).then((r: any) => {
    //             // res.send(200, {result: r});
    //             res.json(200, {result: r});
    //         }).catch((error: any) => {
    //             if (error instanceof NotFoundError) {
    //                 Log.trace("NotFoundError.");
    //                 res.send(404, {error: error.message});
    //             } else {
    //                 Log.trace("InsightError / General.");
    //                 res.send(400, {error: error.message});
    //             }
    //         });
    //     } catch (error) {
    //         if (error instanceof NotFoundError) {
    //             res.send(404, {error: error.message});
    //         } else {
    //             res.send(400, {error: error.message});
    //         }
    //     }
    //     next();
    // }
    //
    // private static postQuery(req: restify.Request, res: restify.Response, next: restify.Next) {
    //     Log.trace("in postQuery");
    //     try {
    //         const query: any = req.params; // TODO
    //         this.inf.performQuery(query).then((r: any) => {
    //             res.json(200, {result: r});
    //         });
    //     } catch (error) {
    //         res.send(400, {error: error.message});
    //     }
    //     return next();
    // }
    //
    // private static getDatasets(req: restify.Request, res: restify.Response, next: restify.Next) {
    //     Log.trace("in getDatasets");
    //     this.inf.listDatasets().then((r: any) => {
    //         res.json(200, {result: r});
    //     });
    //     return next();
    // }
}
