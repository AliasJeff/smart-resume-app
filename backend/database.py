from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# 数据库文件路径（存放在 backend 目录下）
BASE_DIR = Path(__file__).resolve().parent
DATABASE_URL = f"sqlite:///{BASE_DIR / 'resume.db'}"

# SQLite 同步引擎；check_same_thread=False 供 FastAPI 在多线程环境下使用
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

# 会话工厂，用于创建数据库会话
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """SQLAlchemy 模型基类"""

    pass


def get_db():
    """依赖注入：获取数据库会话，请求结束后自动关闭"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
