"use client";

import { forwardRef } from "react";

import type { ResumeData } from "@/types/resume";

type ResumePreviewProps = {
  data: ResumeData;
};

function splitLines(text: string): string[] {
  if (!text.trim()) {
    return [];
  }
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatPeriod(start: string, end: string): string {
  return [start, end].filter(Boolean).join(" – ");
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return null;
  }
  return (
    <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[11px] leading-relaxed text-gray-800">
      {items.map((item, index) => (
        <li key={`${index}-${item.slice(0, 24)}`}>{item}</li>
      ))}
    </ul>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 w-full border-b border-gray-900 pb-1 text-left text-[11px] font-bold uppercase tracking-widest text-gray-900">
      {children}
    </h3>
  );
}

export const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(
  function ResumePreview({ data }, ref) {
    const { basic_info, education, experience, skills } = data;
    const contactParts = [
      basic_info.email,
      basic_info.phone,
      basic_info.location,
    ].filter(Boolean);

    return (
      <div
        ref={ref}
        className="resume-print-root box-border flex w-[210mm] min-h-[297mm] flex-col bg-white px-[14mm] py-[12mm] text-gray-900 shadow-xl print:shadow-none"
      >
        {/* Header */}
        <header className="mb-6 text-center print:break-inside-avoid">
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-gray-900">
            {basic_info.name || "姓名"}
          </h1>
          {contactParts.length > 0 ? (
            <p className="mt-2 text-[11px] text-gray-700">
              {contactParts.join(" | ")}
            </p>
          ) : null}
        </header>

        <div className="flex flex-col gap-6">
          {/* Summary */}
          {basic_info.summary ? (
            <section className="print:break-inside-avoid">
              <SectionHeading>个人简介</SectionHeading>
              <p className="text-[11px] leading-relaxed text-gray-800">
                {basic_info.summary}
              </p>
            </section>
          ) : null}

          {/* Experience */}
          {experience.length > 0 ? (
            <section>
              <SectionHeading>工作与项目经历</SectionHeading>
              <div className="flex flex-col gap-4">
                {experience.map((exp, index) => (
                  <article
                    key={`exp-${index}`}
                    className="print:break-inside-avoid"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[12px] font-bold text-gray-900">
                        {exp.company}
                      </p>
                      {(exp.start_date || exp.end_date) && (
                        <p className="shrink-0 text-[10px] tabular-nums text-gray-600">
                          {formatPeriod(exp.start_date, exp.end_date)}
                        </p>
                      )}
                    </div>
                    {exp.title ? (
                      <p className="mt-0.5 text-[11px] font-medium text-gray-800">
                        {exp.title}
                      </p>
                    ) : null}
                    <BulletList items={splitLines(exp.description)} />
                    {exp.projects.length > 0 ? (
                      <div className="mt-2 space-y-2 pl-2">
                        {exp.projects.map((project, projIndex) => (
                          <div
                            key={`proj-${index}-${projIndex}`}
                            className="print:break-inside-avoid"
                          >
                            <p className="text-[11px] font-semibold text-gray-900">
                              {project.name}
                            </p>
                            <BulletList items={splitLines(project.description)} />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {/* Education */}
          {education.length > 0 ? (
            <section>
              <SectionHeading>教育背景</SectionHeading>
              <div className="flex flex-col gap-3">
                {education.map((edu, index) => (
                  <article
                    key={`edu-${index}`}
                    className="print:break-inside-avoid"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[12px] font-bold text-gray-900">
                        {edu.school}
                      </p>
                      {(edu.start_date || edu.end_date) && (
                        <p className="shrink-0 text-[10px] tabular-nums text-gray-600">
                          {formatPeriod(edu.start_date, edu.end_date)}
                        </p>
                      )}
                    </div>
                    {edu.degree ? (
                      <p className="mt-0.5 text-[11px] font-medium text-gray-800">
                        {edu.degree}
                      </p>
                    ) : null}
                    <BulletList items={splitLines(edu.description)} />
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {/* Skills */}
          {skills.length > 0 ? (
            <section className="print:break-inside-avoid">
              <SectionHeading>技能</SectionHeading>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded border border-gray-300 px-2 py-0.5 text-[10px] leading-snug text-gray-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    );
  },
);
