export type BasicInfo = {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
};

export type Education = {
  school: string;
  degree: string;
  start_date: string;
  end_date: string;
  description: string;
};

export type Project = {
  name: string;
  description: string;
};

export type Experience = {
  company: string;
  title: string;
  start_date: string;
  end_date: string;
  description: string;
  projects: Project[];
};

export type ResumeData = {
  basic_info: BasicInfo;
  education: Education[];
  experience: Experience[];
  skills: string[];
};

export type AnalysisData = {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
};

export type ResumeResponse = {
  id: string;
  filename: string;
  raw_text: string | null;
  parsed_data: ResumeData | null;
  optimized_data: ResumeData | null;
  analysis_data: AnalysisData | null;
};

export const emptyEducation = (): Education => ({
  school: "",
  degree: "",
  start_date: "",
  end_date: "",
  description: "",
});

export const emptyProject = (): Project => ({
  name: "",
  description: "",
});

export const emptyExperience = (): Experience => ({
  company: "",
  title: "",
  start_date: "",
  end_date: "",
  description: "",
  projects: [],
});

const emptyBasicInfo: BasicInfo = {
  name: "",
  email: "",
  phone: "",
  location: "",
  summary: "",
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeBasicInfo(raw: unknown): BasicInfo {
  if (!raw || typeof raw !== "object") {
    return { ...emptyBasicInfo };
  }
  const info = raw as Record<string, unknown>;
  return {
    name: asString(info.name),
    email: asString(info.email),
    phone: asString(info.phone),
    location: asString(info.location),
    summary: asString(info.summary),
  };
}

function normalizeProject(raw: unknown): Project {
  if (!raw || typeof raw !== "object") {
    return { name: "", description: "" };
  }
  const project = raw as Record<string, unknown>;
  return {
    name: asString(project.name),
    description: asString(project.description),
  };
}

function normalizeExperience(raw: unknown): Experience {
  if (!raw || typeof raw !== "object") {
    return {
      company: "",
      title: "",
      start_date: "",
      end_date: "",
      description: "",
      projects: [],
    };
  }
  const exp = raw as Record<string, unknown>;
  const projects = Array.isArray(exp.projects)
    ? exp.projects.map(normalizeProject)
    : [];
  return {
    company: asString(exp.company),
    title: asString(exp.title),
    start_date: asString(exp.start_date),
    end_date: asString(exp.end_date),
    description: asString(exp.description),
    projects,
  };
}

function normalizeEducation(raw: unknown): Education {
  if (!raw || typeof raw !== "object") {
    return {
      school: "",
      degree: "",
      start_date: "",
      end_date: "",
      description: "",
    };
  }
  const edu = raw as Record<string, unknown>;
  return {
    school: asString(edu.school),
    degree: asString(edu.degree),
    start_date: asString(edu.start_date),
    end_date: asString(edu.end_date),
    description: asString(edu.description),
  };
}

export function normalizeAnalysisData(raw: unknown): AnalysisData {
  if (!raw || typeof raw !== "object") {
    return { score: 0, strengths: [], weaknesses: [], suggestions: [] };
  }
  const data = raw as Record<string, unknown>;
  const rawScore = data.score;
  const score =
    typeof rawScore === "number" && !Number.isNaN(rawScore)
      ? Math.max(0, Math.min(100, Math.round(rawScore)))
      : 0;

  const toList = (key: string): string[] => {
    const value = data[key];
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((item): item is string => typeof item === "string");
  };

  return {
    score,
    strengths: toList("strengths"),
    weaknesses: toList("weaknesses"),
    suggestions: toList("suggestions"),
  };
}

export function normalizeResumeData(raw: unknown): ResumeData {
  if (!raw || typeof raw !== "object") {
    return {
      basic_info: { ...emptyBasicInfo },
      education: [],
      experience: [],
      skills: [],
    };
  }
  const data = raw as Record<string, unknown>;
  return {
    basic_info: normalizeBasicInfo(data.basic_info),
    education: Array.isArray(data.education)
      ? data.education.map(normalizeEducation)
      : [],
    experience: Array.isArray(data.experience)
      ? data.experience.map(normalizeExperience)
      : [],
    skills: Array.isArray(data.skills)
      ? data.skills.filter((item): item is string => typeof item === "string")
      : [],
  };
}
