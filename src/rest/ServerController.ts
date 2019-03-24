import restify = require("restify");
import Log from "../Util";
import * as fs from "fs-extra";
import InsightFacade from "../controller/InsightFacade";
import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "../controller/IInsightFacade";

export default class ServerController {
    private static inf = new InsightFacade();

    public static initData(): Promise<any> {
        const courses = fs.readFileSync(__dirname + "/../../test/data/courses.zip").toString("base64");
        const rooms = fs.readFileSync(__dirname + "/../../test/data/rooms.zip").toString("base64");

        // Log.trace("initData courses: " + JSON.stringify(courses));
        // return ServerController.inf.addDataset("courses", courses, InsightDatasetKind.Courses)
        //     .then(() => ServerController.inf.addDataset("rooms", rooms, InsightDatasetKind.Rooms));
        // console.log("init datasets: courses, rooms");
        return Promise.resolve(ServerController.inf.addDataset("courses", courses, InsightDatasetKind.Courses)
            .then(() => ServerController.inf.addDataset("rooms", rooms, InsightDatasetKind.Rooms)));
    }

    // TODO
    public static gotoHome(req: restify.Request, res: restify.Response, next: restify.Next) {
        // fs.readfile
    }

    public static putDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("in putDataset");
        // try {
        const data = new Buffer(req.params.body).toString("base64");
        const id = req.params.id;
        const kind = req.params.kind;
        let insightKind = (kind === "courses") ? InsightDatasetKind.Courses :
            ((kind === "rooms") ? InsightDatasetKind.Rooms : kind);
        ServerController.inf.addDataset(id, data, insightKind).then( (r: any) => {
                res.json(200, {result: r});
            }).catch( (e: any) => {
                Log.trace("caught error in .catch");
                // res.json(400, {error: e.message});
                res.json(400, {error: e.message});
            });
        // } catch (error) {
        //     res.send(400, {error: error.message});
        // }
        return next();
    }

    public static deleteDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("in deleteDataset");
        // try {
        const id = req.params.id;
        Log.trace("id: " + id);
        ServerController.inf.removeDataset(id).then((r: any) => {
                // res.send(200, {result: r});
            res.json(200, {result: r});
        }).catch((error: any) => {
            if (error instanceof NotFoundError) {
                Log.trace("NotFoundError.");
                res.json(404, {error: error.message});
            } else {
                Log.trace("InsightError / General.");
                res.json(400, {error: error.message});
            }
        });
        // } catch (error) {
        //     if (error instanceof NotFoundError) {
        //         res.send(404, {error: error.message});
        //     } else {
        //         res.send(400, {error: error.message});
        //     }
        // }
        return next();
    }

    public static postQuery(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("in postQuery");
        // try {
            // const query: any = req.body; // TODO
        const query: any = req.params;
        ServerController.inf.performQuery(query).then((r: any) => {
                // res.send(200, {result: r});
            res.json(200, {result: r});
        }).catch((error: any) => {
            Log.trace("caught error in .catch: " + error.message);
            res.json(400, {error: error.message});
        });
        // } catch (error) {
        //     res.send(400, {error: error.message});
        // }
        return next();
    }

    public static getDatasets(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("in getDatasets");
        ServerController.inf.listDatasets().then((r: any) => {
            res.json(200, {result: r});
        });
        return next();
    }
}
