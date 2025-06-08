using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Crypto;

[ExportTsInterface]
public record CryptoGenerateKeyPairResult(CryptoKeyInfo PublicKey, CryptoKeyInfo PrivateKey);