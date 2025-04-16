export class PaginationRequest {
    page: number;
    pageSize: number = 10;


    constructor(page: number = 1) {
        this.page = page ?? 1;
    }
}
