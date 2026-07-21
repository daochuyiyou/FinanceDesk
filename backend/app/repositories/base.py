"""BaseRepository — 抽象基类。"""

from abc import ABC, abstractmethod
from typing import Any, Optional


class BaseRepository(ABC):
    """所有 Repository 的抽象基类。"""

    def __init__(self, db):
        self.db = db

    @abstractmethod
    def create(self, fields: dict[str, Any]) -> int:
        ...

    @abstractmethod
    def update(self, record_id: int, fields: dict[str, Any]) -> bool:
        ...

    @abstractmethod
    def rollback(self, record_id: int) -> bool:
        ...

    @abstractmethod
    def find(self, record_id: int) -> Optional[dict]:
        ...

    @abstractmethod
    def find_by_business_key(self, business_key: str) -> Optional[int]:
        ...

    @abstractmethod
    def exists(self, business_key: str) -> bool:
        ...
