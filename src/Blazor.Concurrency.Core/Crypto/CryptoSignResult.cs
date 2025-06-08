using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Crypto;

[ExportTsInterface]
public record CryptoSignResult(byte[] Data);