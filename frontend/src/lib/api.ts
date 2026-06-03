const API_BASE = "http://localhost:8000";

type UploadResponse = {
  id: string;
  message: string;
};

type ParseResponse = {
  id: string;
  parsed_data: Record<string, unknown>;
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
