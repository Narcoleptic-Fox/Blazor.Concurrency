using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Crypto;

[ExportTsInterface]
public record CryptoGenerateKeyPairRequest(string Algorithm = "RSA-OAEP", int KeySize = 2048);