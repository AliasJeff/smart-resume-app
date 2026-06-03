"use client";

import { Download, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";

import { ResumePreview } from "@/components/ResumePreview";
import type { ResumeData } from "@/types/resume";

type ResumePreviewModalProps = {
  open: boolean;
  data: ResumeData;
  onClose: () => void;
};

const printPageStyle = `
  @page {
    size: A4;
    margin: 0;
  }
  @media print {
    html, body {
      margin: 0;
      padding: 0;
    }
    .resume-print-root {
      box-shadow: none !important;
      margin: 0 !important;
    }
  }
`;

export function ResumePreviewModal({
  open,
  data,
  onClose,
}: ResumePreviewModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `${data.basic_info.name || "resume"}-简历`,
    pageStyle: printPageStyle,
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#1a1a1a]/75 backdrop-blur-sm print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-preview-title"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-4 print:hidden">
        <h2
          id="resume-preview-title"
          className="text-base font-semibold text-white"
        >
          简历预览
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="关闭预览"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-1 items-start justify-center overflow-auto px-4 py-8 print:hidden">
        <ResumePreview ref={contentRef} data={data} />
      </div>

      <div className="flex shrink-0 justify-center border-t border-white/10 bg-[#252525]/90 px-6 py-5 print:hidden">
        <button
          type="button"
          onClick={() => handlePrint()}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Download className="h-4 w-4" />
          下载 PDF
        </button>
      </div>
    </div>
  );
}
