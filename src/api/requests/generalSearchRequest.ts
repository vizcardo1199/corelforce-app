export class GeneralSearchRequest {
    code: string;
    description: string;
    account: {id: number} | null;
    plant: {id: number} | null;
    area: {id: number} | null;
    typicalMawoi: {id: number} | null;
    system: {id: number} | null;
    mawoi: {id: number} | null;


    constructor(code: string,
                description: string,
                accountId: number | null = null,
                plantId: number | null = null,
                areaId: number | null = null,
                typicalMawoiId: number | null = null, 
                systemId: number | null = null,
                assetId: number | null = null) {
        this.code = code?.toString() || '';
        this.description = description?.toString() || '';
        this.account = accountId? {id: accountId} : null;
        this.plant = plantId? {id: plantId} : null;
        this.area = areaId? {id: areaId} : null;
        this.typicalMawoi = typicalMawoiId? {id: typicalMawoiId} : null;
        this.system = systemId? {id: systemId} : null;
        this.mawoi = assetId? {id: assetId} : null;
    }
}
