"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AutoTextarea } from "@/components/AutoTextarea";
import { useToast } from "@/components/Toast";
import { getResume, optimizeResume } from "@/lib/api";
import {
  normalizeResumeData,
  type BasicInfo,
  type Education,
  type Experience,
  type ResumeData,
} from "@/types/resume";

type EditorWorkbenchProps = {
  resumeId: string;
};

const fieldClass =
  "w-full rounded-lg border border-transparent bg-background/60 px-3 py-2 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent/30 focus:bg-surface focus:shadow-sm";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 border-b border-border pb-2 text-sm font-semibold tracking-wide text-muted uppercase">
      {children}
    </h2>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-medium text-muted">{children}</label>;
}

function EditorSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <span className="h-10 w-10 rounded-full border-2 border-accent/20 border-t-accent animate-spin-slow" />
        <p className="text-sm text-muted">正在加载简历数据...</p>
      </div>
    </div>
  );
}

function AiPanelSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-12 rounded-xl bg-border/80" />
      <div className="h-4 w-3/4 rounded bg-border/60" />
      <div className="h-4 w-full rounded bg-border/60" />
      <div className="h-4 w-5/6 rounded bg-border/60" />
      <div className="mt-4 h-24 rounded-xl bg-border/40" />
      <div className="h-24 rounded-xl bg-border/40" />
    </div>
  );
}

export function EditorWorkbench({ resumeId }: EditorWorkbenchProps) {
  const { showToast } = useToast();
  const [data, setData] = useState<ResumeData | null>(null);
  const [filename, setFilename] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const resume = await getResume(resumeId);
        if (cancelled) {
          return;
        }
        if (!resume.parsed_data) {
          showToast("简历尚未解析，请返回首页重新上传", "error");
          return;
        }
        setFilename(resume.filename);
        setData(normalizeResumeData(resume.parsed_data));
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "加载简历失败";
          showToast(message, "error");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [resumeId, showToast]);

  const updateBasicInfo = useCallback((field: keyof BasicInfo, value: string) => {
    setData((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        basic_info: { ...prev.basic_info, [field]: value },
      };
    });
  }, []);

  const updateEducation = useCallback(
    (index: number, field: keyof Education, value: string) => {
      setData((prev) => {
        if (!prev) {
          return prev;
        }
        const education = [...prev.education];
        education[index] = { ...education[index], [field]: value };
        return { ...prev, education };
      });
    },
    [],
  );

  const updateExperience = useCallback(
    (index: number, field: keyof Omit<Experience, "projects">, value: string) => {
      setData((prev) => {
        if (!prev) {
          return prev;
        }
        const experience = [...prev.experience];
        experience[index] = { ...experience[index], [field]: value };
        return { ...prev, experience };
      });
    },
    [],
  );

  const updateProject = useCallback(
    (
      expIndex: number,
      projIndex: number,
      field: "name" | "description",
      value: string,
    ) => {
      setData((prev) => {
        if (!prev) {
          return prev;
        }
        const experience = [...prev.experience];
        const projects = [...experience[expIndex].projects];
        projects[projIndex] = { ...projects[projIndex], [field]: value };
        experience[expIndex] = { ...experience[expIndex], projects };
        return { ...prev, experience };
      });
    },
    [],
  );

  const updateSkills = useCallback((value: string) => {
    const skills = value
      .split(/[,，\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
    setData((prev) => (prev ? { ...prev, skills } : prev));
  }, []);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      const result = await optimizeResume(resumeId);
      setData(normalizeResumeData(result.optimized_data));
      showToast("简历优化完毕，已为您应用 STAR 法则！", "success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "AI 优化失败，请稍后重试";
      showToast(message, "error");
    } finally {
      setIsOptimizing(false);
    }
  };

  if (isLoading) {
    return <EditorSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted">无法加载简历内容</p>
        <Link href="/" className="text-sm text-accent hover:underline">
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 px-6 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              ← 返回
            </Link>
            <span className="text-sm font-medium text-foreground">
              {filename || "简历编辑"}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1400px] flex-1 gap-0 lg:gap-0">
        {/* Left: document-style form */}
        <section className="min-w-0 flex-1 overflow-y-auto border-r border-border px-6 py-8 lg:px-10">
          <div className="mx-auto max-w-2xl">
            <h1 className="mb-8 text-2xl font-semibold tracking-tight text-foreground">
              {data.basic_info.name || "未命名简历"}
            </h1>

            <section className="mb-10">
              <SectionTitle>基础信息</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>姓名</FieldLabel>
                  <input
                    className={fieldClass}
                    value={data.basic_info.name}
                    onChange={(e) => updateBasicInfo("name", e.target.value)}
                    placeholder="姓名"
                  />
                </div>
                <div>
                  <FieldLabel>手机</FieldLabel>
                  <input
                    className={fieldClass}
                    value={data.basic_info.phone}
                    onChange={(e) => updateBasicInfo("phone", e.target.value)}
                    placeholder="手机号码"
                  />
                </div>
                <div>
                  <FieldLabel>邮箱</FieldLabel>
                  <input
                    className={fieldClass}
                    value={data.basic_info.email}
                    onChange={(e) => updateBasicInfo("email", e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <FieldLabel>所在地</FieldLabel>
                  <input
                    className={fieldClass}
                    value={data.basic_info.location}
                    onChange={(e) => updateBasicInfo("location", e.target.value)}
                    placeholder="城市"
                  />
                </div>
              </div>
              <div className="mt-4">
                <FieldLabel>个人简介</FieldLabel>
                <AutoTextarea
                  value={data.basic_info.summary}
                  onChange={(v) => updateBasicInfo("summary", v)}
                  placeholder="简要介绍你的背景与优势..."
                  minRows={3}
                />
              </div>
            </section>

            <section className="mb-10">
              <SectionTitle>教育经历</SectionTitle>
              {data.education.length === 0 ? (
                <p className="text-sm text-muted">暂无教育经历</p>
              ) : (
                <div className="flex flex-col gap-8">
                  {data.education.map((edu, index) => (
                    <div
                      key={`edu-${index}`}
                      className="rounded-xl border border-border/80 bg-surface/50 p-5"
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <FieldLabel>学校</FieldLabel>
                          <input
                            className={fieldClass}
                            value={edu.school}
                            onChange={(e) =>
                              updateEducation(index, "school", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <FieldLabel>学历 / 专业</FieldLabel>
                          <input
                            className={fieldClass}
                            value={edu.degree}
                            onChange={(e) =>
                              updateEducation(index, "degree", e.target.value)
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <FieldLabel>开始</FieldLabel>
                            <input
                              className={fieldClass}
                              value={edu.start_date}
                              onChange={(e) =>
                                updateEducation(index, "start_date", e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <FieldLabel>结束</FieldLabel>
                            <input
                              className={fieldClass}
                              value={edu.end_date}
                              onChange={(e) =>
                                updateEducation(index, "end_date", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <FieldLabel>描述</FieldLabel>
                        <AutoTextarea
                          value={edu.description}
                          onChange={(v) => updateEducation(index, "description", v)}
                          minRows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mb-10">
              <SectionTitle>工作经历</SectionTitle>
              {data.experience.length === 0 ? (
                <p className="text-sm text-muted">暂无工作经历</p>
              ) : (
                <div className="flex flex-col gap-10">
                  {data.experience.map((exp, expIndex) => (
                    <article
                      key={`exp-${expIndex}`}
                      className="border-l-2 border-accent/30 pl-5"
                    >
                      <div className="mb-3 grid gap-3 sm:grid-cols-2">
                        <div>
                          <FieldLabel>公司</FieldLabel>
                          <input
                            className={`${fieldClass} font-medium`}
                            value={exp.company}
                            onChange={(e) =>
                              updateExperience(expIndex, "company", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <FieldLabel>职位</FieldLabel>
                          <input
                            className={fieldClass}
                            value={exp.title}
                            onChange={(e) =>
                              updateExperience(expIndex, "title", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <FieldLabel>开始</FieldLabel>
                          <input
                            className={fieldClass}
                            value={exp.start_date}
                            onChange={(e) =>
                              updateExperience(expIndex, "start_date", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <FieldLabel>结束</FieldLabel>
                          <input
                            className={fieldClass}
                            value={exp.end_date}
                            onChange={(e) =>
                              updateExperience(expIndex, "end_date", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <FieldLabel>工作描述</FieldLabel>
                      <AutoTextarea
                        value={exp.description}
                        onChange={(v) => updateExperience(expIndex, "description", v)}
                        minRows={4}
                        placeholder="描述职责与成果..."
                      />
                      {exp.projects.length > 0 ? (
                        <div className="mt-6 space-y-5">
                          <p className="text-xs font-medium text-muted">项目经历</p>
                          {exp.projects.map((project, projIndex) => (
                            <div
                              key={`proj-${expIndex}-${projIndex}`}
                              className="rounded-lg bg-background/80 p-4"
                            >
                              <FieldLabel>项目名称</FieldLabel>
                              <input
                                className={`${fieldClass} mb-3`}
                                value={project.name}
                                onChange={(e) =>
                                  updateProject(
                                    expIndex,
                                    projIndex,
                                    "name",
                                    e.target.value,
                                  )
                                }
                              />
                              <FieldLabel>项目描述</FieldLabel>
                              <AutoTextarea
                                value={project.description}
                                onChange={(v) =>
                                  updateProject(expIndex, projIndex, "description", v)
                                }
                                minRows={3}
                              />
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="mb-16">
              <SectionTitle>技能</SectionTitle>
              <FieldLabel>技能标签（逗号或换行分隔）</FieldLabel>
              <AutoTextarea
                value={data.skills.join("，")}
                onChange={updateSkills}
                minRows={2}
                placeholder="Python, React, SQL..."
              />
            </section>
          </div>
        </section>

        {/* Right: AI control panel */}
        <aside className="w-full shrink-0 border-border bg-surface/40 px-6 py-8 lg:w-[340px] xl:w-[380px]">
          <div className="sticky top-20">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">
              AI 助手
            </p>
            <h2 className="mb-6 text-lg font-semibold text-foreground">
              智能润色工作台
            </h2>

            {isOptimizing ? (
              <AiPanelSkeleton />
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void handleOptimize()}
                  disabled={isOptimizing}
                  className="group relative w-full overflow-hidden rounded-xl px-5 py-4 text-base font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-violet-600 via-accent to-indigo-600 bg-[length:200%_100%] animate-shimmer" />
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="relative flex items-center justify-center gap-2">
                    ✨ AI 一键深度润色
                  </span>
                </button>
                <p className="mt-4 text-xs leading-5 text-muted">
                  基于 STAR 法则优化工作与项目描述，突出量化成果与专业表达。优化结果将直接应用到左侧表单。
                </p>
                <div className="mt-8 rounded-xl border border-dashed border-border bg-background/50 p-4">
                  <p className="text-xs font-medium text-foreground">润色提示</p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted">
                    <li>保留左侧手动修改后再润色</li>
                    <li>优化仅更新描述类字段</li>
                    <li>可随时继续手动编辑</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
