using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Crypto;

[ExportTsInterface]
public record CryptoSignRequest(byte[] Data, CryptoKeyInfo PrivateKey, string Algorithm = "RSASSA-PKCS1-v1_5");