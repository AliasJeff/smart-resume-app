"""LLM service: resume parsing and experience optimization with mock fallback."""

import copy
import json
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

MODEL = "gpt-4o-mini"

MOCK_PARSED_RESUME: dict = {
    "basic_info": {
        "name": "陈思远",
        "email": "chen.siyuan@example.com",
        "phone": "138-1234-5678",
        "location": "上海",
        "summary": (
            "5 年后端开发经验，专注高并发系统与微服务架构，"
            "擅长 Python / Go 技术栈，具备从 0 到 1 搭建业务中台的能力。"
        ),
    },
    "education": [
        {
            "school": "上海交通大学",
            "degree": "软件工程 硕士",
            "start_date": "2015-09",
            "end_date": "2018-06",
            "description": "研究方向：分布式系统；GPA 3.7/4.0",
        },
        {
            "school": "华中科技大学",
            "degree": "计算机科学与技术 学士",
            "start_date": "2011-09",
            "end_date": "2015-06",
            "description": "国家励志奖学金；ACM 校队成员",
        },
    ],
    "experience": [
        {
            "company": "星云科技（上海）有限公司",
            "title": "高级后端工程师",
            "start_date": "2021-03",
            "end_date": "至今",
            "description": (
                "负责订单与库存中台核心模块，主导 API 网关迁移，"
                "支撑日均 200 万+ 订单处理。"
            ),
            "projects": [
                {
                    "name": "订单中台重构",
                    "description": (
                        "将单体订单服务拆分为 6 个微服务，引入 Kafka 异步解耦，"
                        "核心接口 P99 延迟从 800ms 降至 120ms。"
                    ),
                },
                {
                    "name": "库存一致性治理",
                    "description": (
                        "设计 TCC 补偿机制与幂等中间件，"
                        "超卖率从 0.3% 降至 0.01% 以下。"
                    ),
                },
            ],
        },
        {
            "company": "蓝鲸互联科技有限公司",
            "title": "后端工程师",
            "start_date": "2018-07",
            "end_date": "2021-02",
            "description": (
                "参与 SaaS  CRM 产品研发，负责客户数据模块与报表引擎。"
            ),
            "projects": [
                {
                    "name": "报表引擎优化",
                    "description": (
                        "基于 ClickHouse 重构 OLAP 查询层，"
                        "复杂报表生成时间由 45s 缩短至 6s。"
                    ),
                },
            ],
        },
    ],
    "skills": [
        "Python",
        "Go",
        "FastAPI",
        "Django",
        "PostgreSQL",
        "Redis",
        "Kafka",
        "Docker",
        "Kubernetes",
        "微服务架构",
    ],
}

MOCK_OPTIMIZED_RESUME: dict = {
    **MOCK_PARSED_RESUME,
    "experience": [
        {
            "company": "星云科技（上海）有限公司",
            "title": "高级后端工程师",
            "start_date": "2021-03",
            "end_date": "至今",
            "description": (
                "【情境】负责支撑日均 200 万+ 订单的订单与库存中台。"
                "【任务】主导 API 网关迁移并保障业务零中断。"
                "【行动】设计灰度发布与双写校验方案，协调 4 个团队并行改造。"
                "【结果】迁移周期缩短 40%，上线期间零 P0 故障。"
            ),
            "projects": [
                {
                    "name": "订单中台重构",
                    "description": (
                        "【情境】单体订单服务在促销峰值下频繁超时。"
                        "【任务】完成微服务化拆分并提升核心链路稳定性。"
                        "【行动】拆分为 6 个 bounded context 服务，引入 Kafka 事件驱动与熔断降级。"
                        "【结果】核心接口 P99 延迟由 800ms 降至 120ms，峰值可用性达 99.95%。"
                    ),
                },
                {
                    "name": "库存一致性治理",
                    "description": (
                        "【情境】大促期间库存超卖导致客诉上升。"
                        "【任务】建立可审计的库存扣减与补偿机制。"
                        "【行动】落地 TCC 分布式事务与幂等中间件，接入全链路监控告警。"
                        "【结果】超卖率从 0.3% 降至 0.01% 以下，相关客诉下降 92%。"
                    ),
                },
            ],
        },
        {
            "company": "蓝鲸互联科技有限公司",
            "title": "后端工程师",
            "start_date": "2018-07",
            "end_date": "2021-02",
            "description": (
                "【情境】SaaS CRM 客户数据模块承载 5000+ 企业租户。"
                "【任务】提升报表查询性能并降低运维成本。"
                "【行动】主导 ClickHouse  OLAP 层改造，优化 SQL 与分区策略。"
                "【结果】复杂报表生成时间由 45s 缩短至 6s，存储成本降低 35%。"
            ),
            "projects": [
                {
                    "name": "报表引擎优化",
                    "description": (
                        "【情境】原有 MySQL 聚合查询在多维分析场景下响应缓慢。"
                        "【任务】重构报表引擎以支持秒级交互式分析。"
                        "【行动】引入 ClickHouse 列存引擎，设计预聚合宽表与增量同步管道。"
                        "【结果】P95 查询耗时下降 87%，支撑 10 倍数据量增长无需横向扩容。"
                    ),
                },
            ],
        },
    ],
}

PARSE_SYSTEM_PROMPT = """You are a professional resume parser.
Extract structured information from raw resume text and return valid JSON only.

The JSON must contain exactly these four top-level keys:
- basic_info: object with name, email, phone, location, summary (strings; use "" if missing)
- education: array of objects with school, degree, start_date, end_date, description
- experience: array of objects with company, title, start_date, end_date, description, projects
  (projects is an array of {name, description}; use [] if none)
- skills: array of skill strings

Preserve original language (Chinese/English) from the resume. Do not invent facts not in the text."""

OPTIMIZE_SYSTEM_PROMPT = """You are a senior HR consultant specializing in tech resumes.
Rewrite work experience and project descriptions using the STAR method
(Situation, Task, Action, Result).

Rules:
- Keep the same JSON structure and all non-experience fields unchanged.
- Only polish description fields inside experience and experience[].projects.
- Highlight quantified achievements and professional vocabulary.
- Use concise, impactful language; preserve the resume's original language.
- Return valid JSON only."""


def _get_client() -> OpenAI | None:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_openai_api_key":
        return None
    return OpenAI(api_key=api_key)


def _parse_json_content(content: str | None) -> dict | None:
    if not content:
        return None
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return None


def _ensure_parsed_schema(data: dict) -> dict:
    """Ensure parsed JSON contains the four required top-level keys."""
    basic = data.get("basic_info")
    if not isinstance(basic, dict):
        basic = {}
    return {
        "basic_info": {
            "name": basic.get("name") or "",
            "email": basic.get("email") or "",
            "phone": basic.get("phone") or "",
            "location": basic.get("location") or "",
            "summary": basic.get("summary") or "",
        },
        "education": data.get("education") if isinstance(data.get("education"), list) else [],
        "experience": data.get("experience") if isinstance(data.get("experience"), list) else [],
        "skills": data.get("skills") if isinstance(data.get("skills"), list) else [],
    }


def parse_to_json(text: str) -> dict:
    """Parse messy raw resume text into structured JSON with fixed schema."""
    if not text or not text.strip():
        return copy.deepcopy(MOCK_PARSED_RESUME)

    client = _get_client()
    if client is None:
        return copy.deepcopy(MOCK_PARSED_RESUME)

    try:
        response = client.chat.completions.create(
            model=MODEL,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": PARSE_SYSTEM_PROMPT},
                {"role": "user", "content": text},
            ],
            temperature=0.2,
        )
        parsed = _parse_json_content(response.choices[0].message.content)
        if parsed is None:
            return copy.deepcopy(MOCK_PARSED_RESUME)
        return _ensure_parsed_schema(parsed)
    except Exception:
        return copy.deepcopy(MOCK_PARSED_RESUME)


def optimize_experience(parsed_json: dict) -> dict:
    """Rewrite experience descriptions with STAR method; return full optimized JSON."""
    if not parsed_json:
        return copy.deepcopy(MOCK_OPTIMIZED_RESUME)

    client = _get_client()
    if client is None:
        return copy.deepcopy(MOCK_OPTIMIZED_RESUME)

    try:
        response = client.chat.completions.create(
            model=MODEL,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": OPTIMIZE_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": json.dumps(parsed_json, ensure_ascii=False),
                },
            ],
            temperature=0.4,
        )
        optimized = _parse_json_content(response.choices[0].message.content)
        if optimized is None:
            return copy.deepcopy(MOCK_OPTIMIZED_RESUME)
        return _ensure_parsed_schema(optimized)
    except Exception:
        return copy.deepcopy(MOCK_OPTIMIZED_RESUME)
