import { BaseWorkerModule } from './base-module';
export class CryptoModule extends BaseWorkerModule {
    constructor(orchestrator) {
        super(orchestrator);
        this.moduleName = 'crypto';
    }
    async handleEncrypt(data, id) {
        try {
            const algorithm = data.algorithm || 'AES-GCM';
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const cryptoKey = await crypto.subtle.importKey('raw', new Uint8Array(data.key), { name: algorithm }, false, ['encrypt']);
            const encryptedData = await crypto.subtle.encrypt({ name: algorithm, iv }, cryptoKey, new Uint8Array(data.data));
            const result = new Uint8Array(iv.length + encryptedData.byteLength);
            result.set(iv, 0);
            result.set(new Uint8Array(encryptedData), iv.length);
            this.sendResponse({ data: Array.from(result) }, id);
        }
        catch (error) {
            this.sendError(error, id);
        }
    }
    async handleDecrypt(data, id) {
        try {
            const algorithm = data.algorithm || 'AES-GCM';
            const encryptedBytes = new Uint8Array(data.data);
            const iv = encryptedBytes.slice(0, 12);
            const encryptedData = encryptedBytes.slice(12);
            const cryptoKey = await crypto.subtle.importKey('raw', new Uint8Array(data.key), { name: algorithm }, false, ['decrypt']);
            const decryptedData = await crypto.subtle.decrypt({ name: algorithm, iv }, cryptoKey, encryptedData);
            this.sendResponse({ data: Array.from(new Uint8Array(decryptedData)) }, id);
        }
        catch (error) {
            this.sendError(error, id);
        }
    }
    async handleHash(data, id) {
        try {
            const algorithm = data.algorithm || 'SHA-256';
            const hashBuffer = await crypto.subtle.digest(algorithm, new Uint8Array(data.data));
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            this.sendResponse({ data: hashArray }, id);
        }
        catch (error) {
            this.sendError(error, id);
        }
    }
    async handleGenerateKeyPair(data, id) {
        try {
            const algorithm = data.algorithm || 'RSA-OAEP';
            const keySize = data.keySize || 2048;
            let algorithmParams;
            let keyUsages;
            if (algorithm === 'RSA-OAEP') {
                algorithmParams = {
                    name: algorithm,
                    modulusLength: keySize,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: 'SHA-256'
                };
                keyUsages = ['encrypt', 'decrypt'];
            }
            else if (algorithm === 'ECDSA') {
                algorithmParams = {
                    name: algorithm,
                    namedCurve: 'P-256'
                };
                keyUsages = ['sign', 'verify'];
            }
            else {
                throw new Error(`Unsupported algorithm: ${algorithm}`);
            }
            const keyPair = await crypto.subtle.generateKey(algorithmParams, true, keyUsages);
            const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
            const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
            this.sendResponse({
                publicKey: {
                    algorithm: algorithm,
                    type: 'public',
                    extractable: true,
                    keyUsages: keyUsages.filter(u => u === 'encrypt' || u === 'verify'),
                    keyData: publicKeyJwk
                },
                privateKey: {
                    algorithm: algorithm,
                    type: 'private',
                    extractable: true,
                    keyUsages: keyUsages.filter(u => u === 'decrypt' || u === 'sign'),
                    keyData: privateKeyJwk
                }
            }, id);
        }
        catch (error) {
            this.sendError(error, id);
        }
    }
    async handleSign(data, id) {
        try {
            const algorithm = data.algorithm || 'RSASSA-PKCS1-v1_5';
            const privateKey = await crypto.subtle.importKey('jwk', data.privateKey.keyData, { name: algorithm, hash: 'SHA-256' }, false, ['sign']);
            const signature = await crypto.subtle.sign(algorithm, privateKey, new Uint8Array(data.data));
            this.sendResponse({ data: Array.from(new Uint8Array(signature)) }, id);
        }
        catch (error) {
            this.sendError(error, id);
        }
    }
    async handleVerify(data, id) {
        try {
            const algorithm = data.algorithm || 'RSASSA-PKCS1-v1_5';
            const publicKey = await crypto.subtle.importKey('jwk', data.publicKey.keyData, { name: algorithm, hash: 'SHA-256' }, false, ['verify']);
            const isValid = await crypto.subtle.verify(algorithm, publicKey, new Uint8Array(data.signature), new Uint8Array(data.data));
            this.sendResponse({ isValid }, id);
        }
        catch (error) {
            this.sendError(error, id);
        }
    }
}
//# sourceMappingURL=crypto-module.js.map