import { describe, it } from "mocha";
import { expect } from "chai";
import { IPagedList } from "../src/interfaces/IPagedList";
import { IRemoteReq } from "../src/interfaces/IRemoteReq";
import { IRemoteService } from "../src/interfaces/IRemoteService";
import { IOrchestrationMeta, RemoteAggregator } from "../src/RemoteAggregator";

describe("should spawn apt amount of workers", function(){
    it("should should spawn required number of workers", async () => {
        let workerCount = 0, totalItems = 250;
        
        let orchestrationMeta: IOrchestrationMeta = {
            notifyWorkerCount: (count) => {
                workerCount = count;
            }
        }

        let itemStore: number[] = [];
        for(let i=1; i<=totalItems; i++)
            itemStore.push(i);

        let remoteService: IRemoteService<number> = {
            async fetchAsync(req: IRemoteReq): Promise<IPagedList<number>>{
                let resp: IPagedList<number> = {
                    items: req.pageSize == 1 ? [1] : itemStore.splice(0, req.pageSize),
                    totalItems: totalItems,
                    pageNum: req.pageNum,
                    pageSize: req.pageSize
                }

                return Promise.resolve(resp);
            }
        }

        let aggregator: RemoteAggregator<number> = new RemoteAggregator<number>(
            remoteService, 10, 50
        );

        let allItems = await aggregator.retrieveAsync({pageNum: 1, pageSize: 1, clone : function(){
            return this
        }}, orchestrationMeta);

        expect(allItems).not.null;
        expect(allItems.length).equal(totalItems, "Aggregation count mismatch");
        expect(workerCount).lessThan(10);
    })

    it("should should stay at the max specified workers", async () => {
        let workerCount = 0, totalItems = 1000, maxWorkers = 10;
        
        let orchestrationMeta: IOrchestrationMeta = {
            notifyWorkerCount: (count) => {
                workerCount = count;
            }
        }

        let itemStore: number[] = [];
        for(let i=1; i<=totalItems; i++)
            itemStore.push(i);

        let remoteService: IRemoteService<number> = {
            async fetchAsync(req: IRemoteReq): Promise<IPagedList<number>>{
                let resp: IPagedList<number> = {
                    items: req.pageSize == 1 ? [1] : itemStore.splice(0, req.pageSize),
                    totalItems: totalItems,
                    pageNum: req.pageNum,
                    pageSize: req.pageSize
                }

                return Promise.resolve(resp);
            }
        }

        let aggregator: RemoteAggregator<number> = new RemoteAggregator<number>(
            remoteService, maxWorkers, 50
        );

        let allItems = await aggregator.retrieveAsync({pageNum: 1, pageSize: 1, clone : function(){
            return this
        }}, orchestrationMeta);

        expect(allItems).not.null;
        expect(allItems.length).equal(totalItems, "Aggregation count mismatch");
        expect(workerCount).equal(maxWorkers, "Worker count exceed max specified");
    })
});