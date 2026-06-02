import io
import uuid
from contextlib import asynccontextmanager

import pdfplumber
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models  # noqa: F401 — 注册 Resume 模型到 Base.metadata
from database import Base, engine, get_db
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期：启动时自动创建数据库表"""
    Base.metadata.create_all(bind=engine)
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
    }
