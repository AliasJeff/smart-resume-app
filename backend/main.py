import io
import uuid
from contextlib import asynccontextmanager

import pdfplumber
from fastapi import Body, Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

import models  # noqa: F401 — 注册 Resume 模型到 Base.metadata
from database import Base, engine, get_db
from llm_service import analyze_resume, optimize_experience, parse_to_json
from models import Resume


def extract_pdf_text(file_bytes: bytes) -> str:
    """使用 pdfplumber 提取 PDF 全部页面的纯文本"""
    text_parts: list[str] = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts)


def _migrate_sqlite_columns() -> None:
    """为已有 SQLite 库补充新增列（create_all 不会 alter 旧表）"""
    with engine.connect() as conn:
        rows = conn.execute(text("PRAGMA table_info(resumes)")).fetchall()
        columns = {row[1] for row in rows}
        if "analysis_data" not in columns:
            conn.execute(
                text("ALTER TABLE resumes ADD COLUMN analysis_data JSON")
            )
            conn.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期：启动时自动创建数据库表"""
    Base.metadata.create_all(bind=engine)
    _migrate_sqlite_columns()
    yield


app = FastAPI(title="Smart Resume API", lifespan=lifespan)

# 允许 Next.js 前端（localhost:3000）跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    """健康检查接口，用于测试服务是否正常运行"""
    return {"status": "ok"}


@app.post("/api/upload")
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """上传 PDF 简历，提取纯文本并写入数据库"""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="仅支持 PDF 格式")

    content = await file.read()
    if not content.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="仅支持 PDF 格式")

    try:
        raw_text = extract_pdf_text(content)
    except Exception:
        raise HTTPException(status_code=400, detail="PDF 解析失败")

    resume_id = str(uuid.uuid4())
    resume = Resume(
        id=resume_id,
        filename=file.filename,
        raw_text=raw_text,
    )
    db.add(resume)
    db.commit()

    return {"id": resume_id, "message": "上传并解析成功"}


@app.post("/api/parse/{resume_id}")
def parse_resume(resume_id: str, db: Session = Depends(get_db)):
    """读取 raw_text，调用 LLM 结构化解析，写入 parsed_data"""
    resume = db.get(Resume, resume_id)
    if resume is None:
        raise HTTPException(status_code=404, detail="简历不存在")
    if not resume.raw_text or not resume.raw_text.strip():
        raise HTTPException(status_code=400, detail="无原始文本可解析")

    parsed_data = parse_to_json(resume.raw_text)
    resume.parsed_data = parsed_data
    db.commit()

    return {"id": resume_id, "parsed_data": parsed_data}


@app.put("/api/resume/{resume_id}")
def update_resume(
    resume_id: str,
    data: dict = Body(...),
    db: Session = Depends(get_db),
):
    """将前端编辑的最新 JSON 覆盖保存到 parsed_data"""
    resume = db.get(Resume, resume_id)
    if resume is None:
        raise HTTPException(status_code=404, detail="简历不存在")

    resume.parsed_data = data
    db.commit()

    return {"id": resume_id, "parsed_data": data}


@app.post("/api/optimize/{resume_id}")
def optimize_resume(
    resume_id: str,
    data: dict = Body(...),
    db: Session = Depends(get_db),
):
    """使用前端传来的最新数据润色工作经历，同步更新 parsed_data 与 optimized_data"""
    resume = db.get(Resume, resume_id)
    if resume is None:
        raise HTTPException(status_code=404, detail="简历不存在")
    if not data:
        raise HTTPException(status_code=400, detail="简历数据不能为空")

    optimized_data = optimize_experience(data)
    resume.optimized_data = optimized_data
    resume.parsed_data = optimized_data
    db.commit()

    return {"id": resume_id, "optimized_data": optimized_data, "parsed_data": optimized_data}


@app.post("/api/analyze/{resume_id}")
def analyze_resume_route(
    resume_id: str,
    data: dict = Body(...),
    db: Session = Depends(get_db),
):
    """对前端传来的最新简历数据进行 AI 诊断评分"""
    resume = db.get(Resume, resume_id)
    if resume is None:
        raise HTTPException(status_code=404, detail="简历不存在")
    if not data:
        raise HTTPException(status_code=400, detail="简历数据不能为空")

    analysis_data = analyze_resume(data)
    resume.analysis_data = analysis_data
    db.commit()

    return {"id": resume_id, "analysis_data": analysis_data}


@app.get("/api/resume/{resume_id}")
def get_resume(resume_id: str, db: Session = Depends(get_db)):
    """根据 ID 查询单份简历的全部字段"""
    resume = db.get(Resume, resume_id)
    if resume is None:
        raise HTTPException(status_code=404, detail="简历不存在")

    return {
        "id": resume.id,
        "filename": resume.filename,
        "raw_text": resume.raw_text,
        "parsed_data": resume.parsed_data,
        "optimized_data": resume.optimized_data,
        "analysis_data": resume.analysis_data,
    }
