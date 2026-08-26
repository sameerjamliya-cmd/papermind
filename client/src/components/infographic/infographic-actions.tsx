"use client";

import { useState } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { Download, FileText, Loader2, Maximize2, RefreshCw, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "infographic"
  );
}

export function InfographicActions({
  title,
  getNode,
  onFullscreen,
  onViewSources,
  onRegenerate,
  isRegenerating,
}: {
  title: string;
  getNode: () => HTMLElement | null;
  onFullscreen: () => void;
  onViewSources: () => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
}) {
  const [exporting, setExporting] = useState<"png" | "pdf" | null>(null);

  const exportPng = async () => {
    const node = getNode();
    if (!node || exporting) return;
    setExporting("png");
    try {
      const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.download = `${slugify(title)}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setExporting(null);
    }
  };

  const exportPdf = async () => {
    const node = getNode();
    if (!node || exporting) return;
    setExporting("pdf");
    try {
      const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const orientation = img.width >= img.height ? "landscape" : "portrait";
      const pdf = new jsPDF({
        orientation,
        unit: "px",
        format: [img.width, img.height],
        hotfixes: ["px_scaling"],
      });
      pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
      pdf.save(`${slugify(title)}.pdf`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" onClick={exportPng} disabled={!!exporting}>
        {exporting === "png" ? (
          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
        ) : (
          <Download className="mr-1.5 size-3.5" />
        )}
        PNG
      </Button>
      <Button size="sm" variant="outline" onClick={exportPdf} disabled={!!exporting}>
        {exporting === "pdf" ? (
          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
        ) : (
          <FileText className="mr-1.5 size-3.5" />
        )}
        PDF
      </Button>
      <Button size="sm" variant="outline" onClick={onFullscreen}>
        <Maximize2 className="mr-1.5 size-3.5" />
        Fullscreen
      </Button>
      <Button size="sm" variant="outline" onClick={onViewSources}>
        <ScrollText className="mr-1.5 size-3.5" />
        View sources
      </Button>
      <Button size="sm" variant="outline" onClick={onRegenerate} disabled={isRegenerating}>
        {isRegenerating ? (
          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
        ) : (
          <RefreshCw className="mr-1.5 size-3.5" />
        )}
        Regenerate
      </Button>
    </div>
  );
}