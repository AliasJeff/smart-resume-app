import {
  normalizeAnalysisData,
  normalizeResumeData,
  type AnalysisData,
  type ResumeData,
  type ResumeResponse,
} from "@/types/resume";

const API_BASE = "http://localhost:8000";

type UploadResponse = {
  id: string;
  message: string;
};

type ParseResponse = {
  id: string;
  parsed_data: Record<string, unknown>;
};

type UpdateResponse = {
  id: string;
  parsed_data: Record<string, unknown>;
};

type OptimizeResponse = {
  id: string;
  optimized_data: Record<string, unknown>;
  parsed_data: Record<string, unknown>;
};

type AnalyzeResponse = {
  id: string;
  analysis_data: Record<string, unknown>;
};

async function readErrorDetail(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: string | { msg?: string }[] };
    if (typeof data.detail === "string") {
      return data.detail;
    }
    if (Array.isArray(data.detail) && data.detail[0]?.msg) {
      return data.detail[0].msg;
    }
  } catch {
    // ignore JSON parse errors
  }
  return `请求失败（${response.status}）`;
}

async function requestJson<T>(
  url: string,
  options: RequestInit,
  networkError: string,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new Error(networkError);
  }

  if (!response.ok) {
    throw new Error(await readErrorDetail(response));
  }

  return response.json() as Promise<T>;
}

export async function uploadResume(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/upload`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new Error("无法连接服务器，请确认后端已在 localhost:8000 运行");
  }

  if (!response.ok) {
    throw new Error(await readErrorDetail(response));
  }

  return response.json() as Promise<UploadResponse>;
}

export async function parseResume(resumeId: string): Promise<ParseResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/parse/${resumeId}`, {
      method: "POST",
    });
  } catch {
    throw new Error("解析请求失败，请检查网络连接");
  }

  if (!response.ok) {
    throw new Error(await readErrorDetail(response));
  }

  return response.json() as Promise<ParseResponse>;
}

export async function getResume(resumeId: string): Promise<ResumeResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/resume/${resumeId}`);
  } catch {
    throw new Error("无法加载简历，请检查网络连接");
  }

  if (!response.ok) {
    throw new Error(await readErrorDetail(response));
  }

  const raw = (await response.json()) as {
    id: string;
    filename: string;
    raw_text: string | null;
    parsed_data: unknown;
    optimized_data: unknown;
    analysis_data: unknown;
  };

  return {
    id: raw.id,
    filename: raw.filename,
    raw_text: raw.raw_text,
    parsed_data: raw.parsed_data ? normalizeResumeData(raw.parsed_data) : null,
    optimized_data: raw.optimized_data ? normalizeResumeData(raw.optimized_data) : null,
    analysis_data: raw.analysis_data ? normalizeAnalysisData(raw.analysis_data) : null,
  };
}

export async function updateResume(
  resumeId: string,
  data: ResumeData,
): Promise<UpdateResponse> {
  return requestJson<UpdateResponse>(
    `${API_BASE}/api/resume/${resumeId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
    "保存失败，请检查网络连接",
  );
}

export async function optimizeResume(
  resumeId: string,
  data: ResumeData,
): Promise<OptimizeResponse> {
  return requestJson<OptimizeResponse>(
    `${API_BASE}/api/optimize/${resumeId}`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    "优化请求失败，请检查网络连接",
  );
}

export async function analyzeResume(
  resumeId: string,
  data: ResumeData,
): Promise<{ id: string; analysis_data: AnalysisData }> {
  const result = await requestJson<AnalyzeResponse>(
    `${API_BASE}/api/analyze/${resumeId}`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    "诊断请求失败，请检查网络连接",
  );
  return {
    id: result.id,
    analysis_data: normalizeAnalysisData(result.analysis_data),
  };
}
