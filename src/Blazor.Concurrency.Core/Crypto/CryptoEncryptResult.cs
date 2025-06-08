using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Crypto;

[ExportTsInterface]
public record CryptoEncryptResult(byte[] Data);