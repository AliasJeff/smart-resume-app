"""FastAPI 开发服务器启动脚本

用法（在 backend 目录下）:
    python run.py
"""

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
