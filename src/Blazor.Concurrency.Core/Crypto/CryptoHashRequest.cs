using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Crypto;

[ExportTsInterface]
public record CryptoHashRequest(byte[] Data, string Algorithm = "SHA-256");