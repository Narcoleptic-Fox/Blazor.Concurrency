using TypeGen.Core.TypeAnnotations;

namespace Blazor.Concurrency.Crypto;

[ExportTsInterface]
public record CryptoKeyInfo(
    string Algorithm,
    string Type,
    bool Extractable,
    string[] KeyUsages,
    object KeyData
);