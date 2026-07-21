"""自定义 JSON 响应：ensure_ascii=False 确保中文字符不被转义。"""
import json

from fastapi.responses import JSONResponse


class NonAsciiJSONResponse(JSONResponse):
    """重写 render 方法，禁用 ASCII 转义，直接输出 UTF-8 中文字符。"""

    def render(self, content) -> bytes:
        return json.dumps(
            content,
            ensure_ascii=False,
            default=str,
        ).encode("utf-8")
