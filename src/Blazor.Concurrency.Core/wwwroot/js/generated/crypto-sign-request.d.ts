/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */
import { CryptoKeyInfo } from "./crypto-key-info";
export interface CryptoSignRequest {
    data: number[];
    privateKey: CryptoKeyInfo;
    algorithm: string;
}
