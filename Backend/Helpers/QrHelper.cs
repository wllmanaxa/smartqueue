using QRCoder;

namespace Backend.Helpers;

public static class QrHelper
{
    /// <summary>Generates a PNG QR code as base64 data URL.</summary>
    public static string GeneratePngDataUrl(string payload, int pixelsPerModule = 8)
    {
        using var qrGenerator = new QRCodeGenerator();
        using var qrData = qrGenerator.CreateQrCode(payload, QRCodeGenerator.ECCLevel.Q);
        using var qrCode = new PngByteQRCode(qrData);
        var bytes = qrCode.GetGraphic(pixelsPerModule);
        return "data:image/png;base64," + Convert.ToBase64String(bytes);
    }
}
