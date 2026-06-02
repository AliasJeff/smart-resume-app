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

## Data model

Table `resumes` (SQLite `resume.db`):

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Primary key |
| `filename` | string | Original upload filename |
| `raw_text` | text | Plain text extracted from PDF |
| `parsed_data` | JSON | Structured parse result (future) |
| `optimized_data` | JSON | AI-optimized content (future) |

## CORS

Allowed origin: `http://localhost:3000` (Next.js dev server).
