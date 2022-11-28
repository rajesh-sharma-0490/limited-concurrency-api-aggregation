import { IRemoteReq } from "./interfaces/IRemoteReq";
import { IRemoteService } from "./interfaces/IRemoteService";

export interface IOrchestrationMeta{
    notifyWorkerCount(count: number): void;
}

export class RemoteAggregator<T>{
    constructor(
        private remoteService: IRemoteService<T>,
        private maxWorkers: number = 5,
        private unitPageSize: number = 50
    ){}

    public async retrieveAsync(baseReq: IRemoteReq, orchestrationMeta: IOrchestrationMeta | null = null): Promise<T[]>{
        let totalItems = await this.inquireTotalCountAsync(baseReq);

        let workersCount = Math.ceil(totalItems / this.unitPageSize);
        if(workersCount > this.maxWorkers)
            workersCount = this.maxWorkers;

        try{
            orchestrationMeta?.notifyWorkerCount(workersCount);
        }catch(err: any){
            console.error(err);
        }

        let allItems: T[] = [];
        let tasks: Promise<void>[] = [];

        for(let workerIndex = 0; workerIndex < workersCount; workerIndex++)
            tasks.push(this.runWorkerAsync(baseReq, allItems, totalItems, workersCount, workerIndex));

        await Promise.all(tasks);

        return allItems;
    }

    private async runWorkerAsync(baseReq: IRemoteReq, itemStore: T[], totalItems: number, workersCount: number, workerIndex: number){
        let workerBatch = totalItems / workersCount;

        let remaining = workerBatch;

        let pageNum = Math.ceil(workerBatch / this.unitPageSize) * workerIndex;
        pageNum++;
        while(remaining > 0){
            let req = baseReq.clone();
            req.pageNum = pageNum;
            req.pageSize = this.unitPageSize;

            let resp = await this.remoteService.fetchAsync(req);
            itemStore.push(...resp.items);
            
            pageNum++;
            remaining -= this.unitPageSize;
        }
    }

    private async inquireTotalCountAsync(req: IRemoteReq){
        req = req.clone();
        req.pageSize = req.pageNum = 1;

        let response = await this.remoteService.fetchAsync(req);

        return response.totalItems;
    }
}