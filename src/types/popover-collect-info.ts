export interface POPOVER_COLLECT_INFO  {
    crestFactor?: number | null | string;
    lastCrest?: number | null | string;
    peakToPeak?: number | null | string;
    lastPkPk?: number | null | string;
    isOpen?: boolean;
    onToggle: (id: string) => void;
    id?: string;
}
