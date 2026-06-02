from sqlalchemy import JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Resume(Base):
    """简历表：单表存储原始文本、解析结果与 AI 优化结果"""

    __tablename__ = "resumes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)  # UUID 字符串主键
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)  # PDF 提取的原始文本
    parsed_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # 结构化解析数据
    optimized_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # AI 优化后的数据
