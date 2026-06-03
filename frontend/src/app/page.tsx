"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, type DragEvent } from "react";

import { useToast } from "@/components/Toast";
import { parseResume, uploadResume } from "@/lib/api";

type UploadPhase = "idle" | "uploading" | "parsing";

const loadingMessages: Record<Exclude<UploadPhase, "idle">, string> = {
  uploading: "正在上传并提取 PDF 文本...",
  parsing: "正在提取并由 AI 分析文档...",
};

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export default function HomePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [fileName, setFileName] = useState<string | null>(null);

  const isLoading = phase !== "idle";

  const processFile = useCallback(
    async (file: File) => {
      if (!isPdfFile(file)) {
        showToast("仅支持 PDF 格式，请重新选择文件", "error");
        return;
      }

      setFileName(file.name);
      setPhase("uploading");

      try {
        const uploadResult = await uploadResume(file);
        setPhase("parsing");
        await parseResume(uploadResult.id);
        router.push(`/editor/${uploadResult.id}`);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "上传或解析失败，请稍后重试";
        showToast(message, "error");
        setPhase("idle");
        setFileName(null);
      }
    },
    [router, showToast],
  );

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void processFile(file);
    }
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (isLoading) {
      return;
    }
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void processFile(file);
    }
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isLoading) {
      setIsDragging(true);
    }
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(35,131,226,0.08),transparent_45%)]"
      />

      <main className="relative z-10 w-full max-w-xl">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Smart Resume
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            让 AI 读懂你的简历
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted sm:text-base">
            上传 PDF，自动结构化解析工作经历与技能，进入编辑器继续润色与导出。
          </p>
        </div>

        <div
          role="button"
          tabIndex={isLoading ? -1 : 0}
          onClick={() => {
            if (!isLoading) {
              inputRef.current?.click();
            }
          }}
          onKeyDown={(event) => {
            if (!isLoading && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={[
            "group relative overflow-hidden rounded-2xl border bg-surface px-6 py-12 text-center shadow-sm transition-all",
            isDragging
              ? "border-accent bg-sky-50/60 shadow-md"
              : "border-border hover:border-[#d3d1cb] hover:shadow-md",
            isLoading ? "cursor-wait" : "cursor-pointer",
          ].join(" ")}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            disabled={isLoading}
            onChange={onFileChange}
          />

          {isLoading ? (
            <div className="flex flex-col items-center gap-5">
              <div className="relative flex h-16 w-16 items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-accent/10 animate-pulse-ring" />
                <span className="h-10 w-10 rounded-full border-2 border-accent/20 border-t-accent animate-spin-slow" />
              </div>
              <div>
                <p className="text-base font-medium text-foreground">
                  {loadingMessages[phase]}
                </p>
                {fileName ? (
                  <p className="mt-2 truncate text-sm text-muted">{fileName}</p>
                ) : null}
                <p className="mt-3 bg-gradient-to-r from-foreground via-accent to-foreground bg-clip-text text-xs text-transparent animate-shimmer">
                  AI 正在理解文档结构与关键信息
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background text-accent transition-colors group-hover:border-accent/30 group-hover:bg-sky-50">
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="h-7 w-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16V4m0 0l4 4m-4-4L8 8m-2 8h12a2 2 0 002-2v-1a4 4 0 00-4-4H8a4 4 0 00-4 4v1a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-base font-medium text-foreground">
                  点击或拖拽上传 PDF 简历
                </p>
                <p className="mt-2 text-sm text-muted">支持单文件，最大建议 10MB</p>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          文档仅用于解析与润色，不会对外公开分享。
        </p>
      </main>
    </div>
  );
}
