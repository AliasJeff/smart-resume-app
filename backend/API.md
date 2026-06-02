# Backend API

Base URL: `http://localhost:8000`

Interactive docs: `http://localhost:8000/docs`

## Endpoints

### Health check

`GET /api/health`

Verify the service is running.

**Response 200**

```json
{
  "status": "ok"
}
```

---

### Upload PDF resume

`POST /api/upload`

Upload a PDF file, extract plain text with pdfplumber, and save to SQLite.

**Request**

- Content-Type: `multipart/form-data`
- Body: form field `file` (PDF only)

**Response 200**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "上传并解析成功"
}
```

**Errors**

| Status | Detail |
|--------|--------|
| 400 | `仅支持 PDF 格式` — wrong extension or not a PDF file |
| 400 | `PDF 解析失败` — pdfplumber could not read the file |

**Example**

```bash
curl -X POST http://localhost:8000/api/upload \
  -F "file=@resume.pdf"
```

---

### Get resume by ID

`GET /api/resume/{id}`

Return all fields for a single resume.

**Path params**

| Name | Type | Description |
|------|------|-------------|
| `id` | string | Resume UUID |

**Response 200**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "resume.pdf",
  "raw_text": "extracted plain text...",
  "parsed_data": null,
  "optimized_data": null
}
```

**Errors**

| Status | Detail |
|--------|--------|
| 404 | `简历不存在` |

**Example**

```bash
curl http://localhost:8000/api/resume/550e8400-e29b-41d4-a716-446655440000
```

---

### Parse resume to structured JSON

`POST /api/parse/{id}`

Read `raw_text` from the database, call OpenAI to extract structured JSON, save to `parsed_data`, and return the result.

Requires `OPENAI_API_KEY` in `backend/.env`. If the key is missing or the LLM call fails, returns fixed mock data (same JSON shape) so the app never crashes.

**Path params**

| Name | Type | Description |
|------|------|-------------|
| `id` | string | Resume UUID |

**Response 200**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "parsed_data": {
    "basic_info": {
      "name": "陈思远",
      "email": "chen.siyuan@example.com",
      "phone": "138-1234-5678",
      "location": "上海",
      "summary": "5 年后端开发经验..."
    },
    "education": [
      {
        "school": "上海交通大学",
        "degree": "软件工程 硕士",
        "start_date": "2015-09",
        "end_date": "2018-06",
        "description": "研究方向：分布式系统；GPA 3.7/4.0"
      }
    ],
    "experience": [
      {
        "company": "星云科技（上海）有限公司",
        "title": "高级后端工程师",
        "start_date": "2021-03",
        "end_date": "至今",
        "description": "负责订单与库存中台核心模块...",
        "projects": [
          {
            "name": "订单中台重构",
            "description": "将单体订单服务拆分为 6 个微服务..."
          }
        ]
      }
    ],
    "skills": ["Python", "Go", "FastAPI"]
  }
}
```

**Errors**

| Status | Detail |
|--------|--------|
| 404 | `简历不存在` |
| 400 | `无原始文本可解析` — empty or missing `raw_text` |

**Example**

```bash
curl -X POST http://localhost:8000/api/parse/550e8400-e29b-41d4-a716-446655440000
```

---

### Optimize experience with STAR method

`POST /api/optimize/{id}`

Read `parsed_data`, call OpenAI to rewrite work and project descriptions using the STAR method (quantified results, professional vocabulary), save to `optimized_data`, and return the result. Non-experience fields are preserved.

Requires a prior successful parse (`parsed_data` must exist). Uses the same mock fallback as parse when the key is missing or the call fails.

**Path params**

| Name | Type | Description |
|------|------|-------------|
| `id` | string | Resume UUID |

**Response 200**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "optimized_data": {
    "basic_info": { "...": "unchanged from parsed_data" },
    "education": [],
    "experience": [
      {
        "company": "星云科技（上海）有限公司",
        "title": "高级后端工程师",
        "start_date": "2021-03",
        "end_date": "至今",
        "description": "【情境】负责支撑日均 200 万+ 订单的订单与库存中台。【任务】...",
        "projects": [
          {
            "name": "订单中台重构",
            "description": "【情境】单体订单服务在促销峰值下频繁超时。【任务】..."
          }
        ]
      }
    ],
    "skills": ["Python", "Go", "FastAPI"]
  }
}
```

**Errors**

| Status | Detail |
|--------|--------|
| 404 | `简历不存在` |
| 400 | `请先解析简历` — `parsed_data` is null |

**Example**

```bash
curl -X POST http://localhost:8000/api/optimize/550e8400-e29b-41d4-a716-446655440000
```

## Parsed JSON schema

Both `parsed_data` and `optimized_data` share this top-level shape:

| Key | Type | Description |
|-----|------|-------------|
| `basic_info` | object | `name`, `email`, `phone`, `location`, `summary` |
| `education` | array | `school`, `degree`, `start_date`, `end_date`, `description` |
| `experience` | array | `company`, `title`, `start_date`, `end_date`, `description`, `projects[]` |
| `skills` | array | List of skill strings |

## LLM configuration

| Variable | Location | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | `backend/.env` | OpenAI API key (see `.env.example`) |

Model: `gpt-4o-mini` via the official `openai` Python library.

## Data model

Table `resumes` (SQLite `resume.db`):

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Primary key |
| `filename` | string | Original upload filename |
| `raw_text` | text | Plain text extracted from PDF |
| `parsed_data` | JSON | Structured parse result (`basic_info`, `education`, `experience`, `skills`) |
| `optimized_data` | JSON | STAR-optimized experience descriptions (same schema as `parsed_data`) |

## CORS

Allowed origin: `http://localhost:3000` (Next.js dev server).
