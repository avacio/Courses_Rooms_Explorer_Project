import restify = require("restify");
import Log from "../Util";
import * as fs from "fs-extra";
import InsightFacade from "../controller/InsightFacade";
import {InsightDatasetKind, InsightError, InsightResponse, NotFoundError} from "../controller/IInsightFacade";
import {expect} from "chai";

export default class ServerController {
    private static inf = new InsightFacade();

    // TODO
    public static gotoHome(req: restify.Request, res: restify.Response, next: restify.Next) {
        // fs.readfile
    }

    public static putDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("in putDataset");
        try {
            const id = req.params.id;
            const kind = req.params.kind;
            const newContent = req.body.content;
            Log.trace("id: " + id + ", kind: " + kind + ", newContent: " + newContent);

            // if (kind !== InsightDatasetKind.Courses || kind !== InsightDatasetKind.Rooms) {
            if (kind !== "courses" || kind !== "rooms") {
                Log.trace("input kind is not courses or rooms");
                throw new InsightError("input kind is not courses or rooms");
            }

            let buffer: any = [];
            req.on("data", (chunk: any) => { // TODO
                buffer.push(chunk);
            });

            req.once("end", () => {
                req.body = Buffer.concat(buffer).toString("base64");
                // this.inf.addDataset(id, newContent, kind).then((r: InsightResponse) => {
                ServerController.inf.addDataset(id, newContent, kind).then((r: any) => {
                    // res.json(r.code, r.body);
                    // res.send(200, {result: r});
                    res.json(200, {result: r});
                });
            });
        } catch (error) {
            res.send(400, {error: error.message});
        }
        next();
    }

    public static deleteDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("in deleteDataset");
        try {
            const id = req.params.id;
            Log.trace("id: " + id);
            ServerController.inf.removeDataset(id).then((r: any) => {
                // res.send(200, {result: r});
                res.json(200, {result: r});
            }).catch((error: any) => {
                if (error instanceof NotFoundError) {
                    Log.trace("NotFoundError.");
                    res.send(404, {error: error.message});
                } else {
                    Log.trace("InsightError / General.");
                    res.send(400, {error: error.message});
                }
            });
        } catch (error) {
            if (error instanceof NotFoundError) {
                res.send(404, {error: error.message});
            } else {
                res.send(400, {error: error.message});
            }
        }
        next();
    }

    public static postQuery(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("in postQuery");
        try {
            const query: any = req.params; // TODO
            ServerController.inf.performQuery(query).then((r: any) => {
                // res.json(r.code, r.body);
                // res.send(200, {result: r});
                res.json(200, {result: r});
            });
        } catch (error) {
            res.send(400, {error: error.message});
        }
        next();
    }

    public static getDatasets(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("in getDatasets");
        // try {
        ServerController.inf.listDatasets().then((r: any) => {
            // res.json(r.code, r.body);
                res.send(200, {result: r});
            // res.json(200, {result: r});
        });
        // } catch (error) {
        //     res.send(400, {error: error.message});
        // }
        // next();
        return next();
    }
}
