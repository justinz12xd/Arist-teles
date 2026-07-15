from collections.abc import Mapping
from typing import Any

import httpx

from .config import Settings


class InsForgeError(RuntimeError):
    def __init__(self, status_code: int, detail: Any):
        super().__init__(f"InsForge request failed ({status_code}): {detail}")
        self.status_code = status_code
        self.detail = detail


class InsForgeRepository:
    """Small PostgREST adapter; all calls are scoped by the request token or admin key."""

    def __init__(self, settings: Settings, access_token: str | None = None):
        self.settings = settings
        self.access_token = access_token

    def _headers(self) -> dict[str, str]:
        token = self.access_token or self.settings.insforge_api_key
        if not token:
            raise RuntimeError("INSFORGE_API_KEY or a user access token is required")
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        if self.settings.insforge_anon_key:
            headers["apikey"] = self.settings.insforge_anon_key
        return headers

    async def request(
        self,
        method: str,
        table: str,
        *,
        params: Mapping[str, str] | None = None,
        json: Any = None,
        headers: Mapping[str, str] | None = None,
    ) -> Any:
        request_headers = self._headers()
        request_headers.update(headers or {})
        async with httpx.AsyncClient(base_url=self.settings.rest_url, timeout=30) as client:
            response = await client.request(
                method, f"/{table}", params=params, json=json, headers=request_headers
            )
        if response.is_error:
            try:
                detail = response.json()
            except ValueError:
                detail = response.text
            raise InsForgeError(response.status_code, detail)
        if not response.content:
            return None
        return response.json()

    async def select_one(self, table: str, filters: Mapping[str, str]) -> dict[str, Any] | None:
        rows = await self.request("GET", table, params={**filters, "limit": "1"})
        return rows[0] if rows else None

    async def select_many(self, table: str, filters: Mapping[str, str]) -> list[dict[str, Any]]:
        return await self.request("GET", table, params=filters) or []

    async def insert(self, table: str, row: dict[str, Any]) -> dict[str, Any]:
        rows = await self.request(
            "POST",
            table,
            params={"select": "*"},
            json=[row],
            headers={"Prefer": "return=representation"},
        )
        return rows[0]

    async def update(
        self, table: str, filters: Mapping[str, str], patch: dict[str, Any]
    ) -> dict[str, Any] | None:
        rows = await self.request(
            "PATCH",
            table,
            params={**filters, "select": "*"},
            json=patch,
            headers={"Prefer": "return=representation"},
        )
        return rows[0] if rows else None

    async def delete(self, table: str, filters: Mapping[str, str]) -> None:
        await self.request("DELETE", table, params=filters)

    async def download_url(self, url: str) -> bytes:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.get(url, headers=self._headers())
        if response.is_error:
            raise InsForgeError(response.status_code, "Storage download failed")
        return response.content

    async def rpc(self, function: str, payload: dict[str, Any]) -> list[dict[str, Any]]:
        result = await self.request("POST", f"rpc/{function}", json=payload)
        return result or []
