using Blazor.Concurrency.Crypto;

namespace Blazor.Concurrency;

public interface ICryptographyService
{
    Task<byte[]> EncryptAsync(byte[] data, byte[] key, CancellationToken cancellationToken = default);
    Task<byte[]> DecryptAsync(byte[] encryptedData, byte[] key, CancellationToken cancellationToken = default);
    Task<byte[]> HashAsync(byte[] data, string algorithm = "SHA-256", CancellationToken cancellationToken = default);
    Task<CryptoGenerateKeyPairResult> GenerateKeyPairAsync(string algorithm = "RSA-OAEP", int keySize = 2048, CancellationToken cancellationToken = default);
    Task<byte[]> SignAsync(byte[] data, CryptoKeyInfo privateKey, string algorithm = "RSASSA-PKCS1-v1_5", CancellationToken cancellationToken = default);
    Task<bool> VerifyAsync(byte[] data, byte[] signature, CryptoKeyInfo publicKey, string algorithm = "RSASSA-PKCS1-v1_5", CancellationToken cancellationToken = default);
}
