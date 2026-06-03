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

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return null;
  }
  return (
    <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-gray-800">
      {items.map((item, index) => (
        <li key={`${index}-${item.slice(0, 24)}`}>{item}</li>
      ))}
    </ul>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 border-b border-gray-300 pb-1 text-[11px] font-bold uppercase tracking-widest text-gray-900">
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
        className="resume-print-root box-border w-[210mm] min-h-[297mm] bg-white px-[14mm] py-[12mm] text-gray-900 shadow-xl print:shadow-none"
      >
        {/* Header */}
        <header className="border-b-2 border-gray-900 pb-4">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-gray-900">
            {basic_info.name || "姓名"}
          </h1>
          {contactParts.length > 0 ? (
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-600">
              {contactParts.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </p>
          ) : null}
        </header>

        <div className="mt-5 grid grid-cols-[72mm_1fr] gap-6">
          {/* Left column */}
          <aside className="space-y-5">
            {skills.length > 0 ? (
              <section>
                <SectionHeading>技能</SectionHeading>
                <ul className="space-y-1.5">
                  {skills.map((skill) => (
                    <li
                      key={skill}
                      className="flex items-start gap-2 text-[11px] text-gray-800"
                    >
                      <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-gray-900" />
                      <span>{skill}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {education.length > 0 ? (
              <section>
                <SectionHeading>教育背景</SectionHeading>
                <div className="space-y-3">
                  {education.map((edu, index) => (
                    <div key={`edu-${index}`}>
                      <p className="text-[11px] font-semibold text-gray-900">
                        {edu.school}
                      </p>
                      <p className="text-[10px] text-gray-600">{edu.degree}</p>
                      {(edu.start_date || edu.end_date) && (
                        <p className="text-[10px] text-gray-500">
                          {[edu.start_date, edu.end_date].filter(Boolean).join(" — ")}
                        </p>
                      )}
                      <BulletList items={splitLines(edu.description)} />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>

          {/* Right column */}
          <main className="space-y-5">
            {basic_info.summary ? (
              <section>
                <SectionHeading>个人简介</SectionHeading>
                <p className="text-[11px] leading-relaxed text-gray-800">
                  {basic_info.summary}
                </p>
              </section>
            ) : null}

            {experience.length > 0 ? (
              <section>
                <SectionHeading>工作经历</SectionHeading>
                <div className="space-y-4">
                  {experience.map((exp, index) => (
                    <article key={`exp-${index}`}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <p className="text-[12px] font-bold text-gray-900">
                            {exp.company}
                          </p>
                          <p className="text-[11px] font-medium text-gray-700">
                            {exp.title}
                          </p>
                        </div>
                        {(exp.start_date || exp.end_date) && (
                          <p className="text-[10px] text-gray-500">
                            {[exp.start_date, exp.end_date]
                              .filter(Boolean)
                              .join(" — ")}
                          </p>
                        )}
                      </div>
                      <BulletList items={splitLines(exp.description)} />
                      {exp.projects.length > 0 ? (
                        <div className="mt-2 space-y-2 border-l-2 border-gray-200 pl-3">
                          {exp.projects.map((project, projIndex) => (
                            <div key={`proj-${index}-${projIndex}`}>
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
          </main>
        </div>
      </div>
    );
  },
);
