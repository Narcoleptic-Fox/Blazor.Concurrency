using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Crypto;

[ExportTsInterface]
public record CryptoEncryptRequest(byte[] Data, byte[] Key, string Algorithm = "AES-GCM");