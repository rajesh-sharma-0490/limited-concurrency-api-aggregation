import { IPagedList } from "./IPagedList";
import { IRemoteReq } from "./IRemoteReq";

export interface IRemoteService<T>{
    fetchAsync(req: IRemoteReq): Promise<IPagedList<T>>;
}