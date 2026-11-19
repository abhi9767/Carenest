import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Check, Copy } from 'lucide-react';

interface BatchQrCodeProps {
  value: string;
  batchCode: string;
  productLabel?: string;
  size?: number;
  darkColor?: string;
  showActions?: boolean;
}

export function BatchQrCode({
  value,
  batchCode,
  productLabel,
  size = 200,
  darkColor = '#153B24',
  showActions = true,
}: BatchQrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copiedPayload, setCopiedPayload] = useState(false);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, {
      errorCorrectionLevel: 'Q',
      margin: 2,
      width: size * 2,
      color: {
        dark: darkColor,
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        if (active) setDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [value, size, darkColor]);

  const handleDownloadPng = async () => {
    try {
      const highResUrl = await QRCode.toDataURL(value, {
        errorCorrectionLevel: 'H',
        margin: 3,
        width: 512,
        color: {
          dark: darkColor,
          light: '#FFFFFF',
        },
      });
      const link = document.createElement('a');
      link.href = highResUrl;
      link.download = `CareNest-SkinAid-${batchCode}-QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // Fallback ignored
    }
  };

  const handleCopyPayload = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard fallback
    }
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-[#12141C]/10 flex flex-col items-center">
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={`Scannable QR Code for SkinAid Batch ${batchCode}`}
            width={size}
            height={size}
            className="rounded-lg block"
          />
        ) : (
          <div
            style={{ width: size, height: size }}
            className="rounded-lg bg-[#FAF8F5] flex items-center justify-center text-xs font-mono text-[#12141C]/50"
          >
            Generating QR...
          </div>
        )}
        <div className="mt-2 text-center">
          <p className="font-mono text-[11px] font-semibold text-[#153B24] tracking-wider">
            BATCH #{batchCode}
          </p>
          {productLabel && (
            <p className="text-[10px] text-[#12141C]/60 max-w-[200px] truncate">
              {productLabel}
            </p>
          )}
        </div>
      </div>

      {showActions && (
        <div className="flex flex-wrap items-center justify-center gap-2 w-full">
          <button
            type="button"
            onClick={handleDownloadPng}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PNG Label</span>
          </button>
          <button
            type="button"
            onClick={handleCopyPayload}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            {copiedPayload ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Payload Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy QR URL</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
