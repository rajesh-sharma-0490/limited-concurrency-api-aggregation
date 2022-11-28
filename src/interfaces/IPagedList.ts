export interface IPagedList<T>{
    items: T[];
    pageNum: number;
    pageSize: number;
    totalItems: number;
}