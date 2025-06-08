import { BaseWorkerModule } from './base-module';
import type { CryptoEncryptRequest, CryptoDecryptRequest, CryptoHashRequest, CryptoGenerateKeyPairRequest, CryptoSignRequest, CryptoVerifyRequest } from '../generated';
export declare class CryptoModule extends BaseWorkerModule {
    readonly moduleName = "crypto";
    constructor(orchestrator: any);
    handleEncrypt(data: CryptoEncryptRequest, id: string): Promise<void>;
    handleDecrypt(data: CryptoDecryptRequest, id: string): Promise<void>;
    handleHash(data: CryptoHashRequest, id: string): Promise<void>;
    handleGenerateKeyPair(data: CryptoGenerateKeyPairRequest, id: string): Promise<void>;
    handleSign(data: CryptoSignRequest, id: string): Promise<void>;
    handleVerify(data: CryptoVerifyRequest, id: string): Promise<void>;
}
