export interface IRemoteReq{
    pageNum: number;
    pageSize: number;
    clone(): IRemoteReq;
}