using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Crypto;

[ExportTsInterface]
public record CryptoVerifyRequest(byte[] Data, byte[] Signature, CryptoKeyInfo PublicKey, string Algorithm = "RSASSA-PKCS1-v1_5");