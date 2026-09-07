export declare const INVENTORY_SECTION_OS = "===OS===";
export declare const INVENTORY_SECTION_RAM = "===RAM===";
export declare const INVENTORY_SECTION_CPU = "===CPU===";
export declare const INVENTORY_SECTION_HOSTNAMES = "===HOSTNAMES===";
export declare const INVENTORY_SECTION_IPV4 = "===IPV4===";
export declare const INVENTORY_SECTION_IPV6 = "===IPV6===";
/** Single compound shell script to collect inventory data in one SSH exec. */
export declare function buildInventoryCollectScript(): string;
