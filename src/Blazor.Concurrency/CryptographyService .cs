using Blazor.Concurrency.Crypto;
using Blazor.Concurrency.Workers;

namespace Blazor.Concurrency;

internal class CryptographyService : ICryptographyService
{
    private readonly IWorkerExecutor _workerExecutor;

    public CryptographyService(IWorkerExecutor workerExecutor) => _workerExecutor = workerExecutor;

    public async Task<byte[]> EncryptAsync(byte[] data, byte[] key, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Create("crypto", "encrypt", new { data, key, algorithm = "AES-GCM" });
        CryptoResult result = await _workerExecutor.ExecuteAsync<CryptoResult>(operation, cancellationToken);
        return result.Data;
    }

    public async Task<byte[]> DecryptAsync(byte[] encryptedData, byte[] key, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Create("crypto", "decrypt", new { data = encryptedData, key, algorithm = "AES-GCM" });
        CryptoResult result = await _workerExecutor.ExecuteAsync<CryptoResult>(operation, cancellationToken);
        return result.Data;
    }

    public async Task<byte[]> HashAsync(byte[] data, string algorithm = "SHA-256", CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Create("crypto", "hash", new { data, algorithm });
        CryptoResult result = await _workerExecutor.ExecuteAsync<CryptoResult>(operation, cancellationToken);
        return result.Data;
    }

    public async Task<CryptoGenerateKeyPairResult> GenerateKeyPairAsync(string algorithm = "RSA-OAEP", int keySize = 2048, CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Create("crypto", "generateKeyPair", new { algorithm, keySize });
        CryptoGenerateKeyPairResult result = await _workerExecutor.ExecuteAsync<CryptoGenerateKeyPairResult>(operation, cancellationToken);
        return result;
    }

    public async Task<byte[]> SignAsync(byte[] data, CryptoKeyInfo privateKey, string algorithm = "RSASSA-PKCS1-v1_5", CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Create("crypto", "sign", new { data, privateKey, algorithm });
        CryptoResult result = await _workerExecutor.ExecuteAsync<CryptoResult>(operation, cancellationToken);
        return result.Data;
    }

    public async Task<bool> VerifyAsync(byte[] data, byte[] signature, CryptoKeyInfo publicKey, string algorithm = "RSASSA-PKCS1-v1_5", CancellationToken cancellationToken = default)
    {
        WorkerOperation operation = WorkerOperation.Create("crypto", "verify", new { data, signature, publicKey, algorithm });
        CryptoVerifyResult result = await _workerExecutor.ExecuteAsync<CryptoVerifyResult>(operation, cancellationToken);
        return result.IsValid;
    }
}

internal record CryptoResult(byte[] Data);
internal record CryptoKeyPairResult(CryptoKey PublicKey, CryptoKey PrivateKey);
internal record CryptoVerifyResult(bool IsValid);
