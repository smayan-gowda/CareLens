import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Smartphone, Copy, Check, Sparkles, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/useAuthStore";
import { useHomeStore } from "@/stores/useHomeStore";

interface QrHandoffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultHomeId?: string;
  defaultRoomType?: string;
}

export function QrHandoffModal({
  open,
  onOpenChange,
  defaultHomeId,
  defaultRoomType
}: QrHandoffModalProps) {
  const { user } = useAuthStore();
  const { homes } = useHomeStore();
  const [copied, setCopied] = useState(false);

  const selectedHomeId = defaultHomeId || homes[0]?.id || "";

  // Construct mobile upload target URL
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const params = new URLSearchParams();
  if (selectedHomeId) params.set("homeId", selectedHomeId);
  if (defaultRoomType) params.set("roomType", defaultRoomType);
  if (user?.uid) params.set("uid", user.uid);

  const mobileUrl = `${origin}/vault/mobile?${params.toString()}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mobileUrl);
      setCopied(true);
      toast.success("Mobile link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border p-6">
        <DialogHeader className="text-center sm:text-left space-y-1.5">
          <div className="flex items-center gap-2 text-brand">
            <Smartphone className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider font-semibold">Cross-Device Capture</span>
          </div>
          <DialogTitle className="text-xl font-medium tracking-tight">
            Take photos on your phone
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Scan this code with your smartphone camera. You can snap rooms, add notes, and they will sync to your computer instantly.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6 bg-muted/40 rounded-xl border border-border/80 my-2">
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <QRCodeSVG 
              value={mobileUrl}
              size={180}
              level="M"
              includeMargin={false}
            />
          </div>
          <div className="flex items-center gap-2 mt-4 text-[12px] text-muted-foreground font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Real-time cloud sync active</span>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 text-xs h-9 justify-center gap-1.5"
              onClick={handleCopy}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied Link" : "Copy Mobile Link"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="text-xs h-9 justify-center gap-1.5"
              asChild
            >
              <a href={mobileUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="w-3.5 h-3.5" /> Test on this Tab
              </a>
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground/80 text-center leading-normal">
            No app download required. Works in mobile Safari, Chrome, and Samsung Internet.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
