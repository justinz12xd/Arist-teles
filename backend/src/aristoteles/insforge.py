from collections.abc import Mapping
from typing import Any
from urllib.parse import quote, urlsplit, urlunsplit

import httpx

from .config import Settings


class InsForgeError(RuntimeError):
    def __init__(self, status_code: int, detail: Any):
        super().__init__(f"InsForge request failed ({status_code}): {detail}")
        self.status_code = status_code
        self.detail = detail


class InsForgeRepository:
    """Small PostgREST adapter; all calls are scoped by the request token or admin key."""

    def __init__(
        self,
        settings: Settings,
        access_token: str | None = None,
        transport: httpx.AsyncBaseTransport | None = None,
    ):
        self.settings = settings
        self.access_token = access_token
        self.transport = transport

    def _headers(self) -> dict[str, str]:
        token = self.access_token or self.settings.insforge_api_key
        if not token:
            raise RuntimeError("INSFORGE_API_KEY or a user access token is required")
        token_value = token.get_secret_value() if hasattr(token, "get_secret_value") else token
        headers = {"Authorization": f"Bearer {token_value}", "Content-Type": "application/json"}
        if self.settings.insforge_anon_key:
            headers["apikey"] = self.settings.insforge_anon_key.get_secret_value()
        return headers

    async def _database_request(
        self,
        method: str,
        path: str,
        *,
        params: Mapping[str, str] | None = None,
        json: Any = None,
        headers: Mapping[str, str] | None = None,
    ) -> Any:
        request_headers = self._headers()
        request_headers.update(headers or {})
        async with httpx.AsyncClient(
            base_url=self.settings.database_url,
            timeout=30,
            transport=self.transport,
        ) as client:
            response = await client.request(
                method, path, params=params, json=json, headers=request_headers
            )
        if response.is_error:
            try:
                detail = response.json()
            except ValueError:
                detail = response.text
            raise InsForgeError(response.status_code, detail)
        if not response.content:
            return None
        payload = response.json()
        if isinstance(payload, dict) and "data" in payload:
            return payload["data"]
        return payload

    async def request(
        self,
        method: str,
        table: str,
        *,
        params: Mapping[str, str] | None = None,
        json: Any = None,
        headers: Mapping[str, str] | None = None,
    ) -> Any:
        path = f"records/{quote(table, safe='')}"
        return await self._database_request(
            method,
            path,
            params=params,
            json=json,
            headers=headers,
        )

    async def select_one(self, table: str, filters: Mapping[str, str]) -> dict[str, Any] | None:
        rows = await self.request("GET", table, params={**filters, "limit": "1"})
        return rows[0] if rows else None

    async def select_many(self, table: str, filters: Mapping[str, str]) -> list[dict[str, Any]]:
        return await self.request("GET", table, params=filters) or []

    async def insert(self, table: str, row: dict[str, Any]) -> dict[str, Any]:
        rows = await self.request(
            "POST",
            table,
            params={"select": "*", "return": "representation"},
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
            params={**filters, "select": "*", "return": "representation"},
            json=patch,
            headers={"Prefer": "return=representation"},
        )
        return rows[0] if rows else None

    async def delete(self, table: str, filters: Mapping[str, str]) -> None:
        await self.request("DELETE", table, params=filters)

    def storage_object_url(self, *, bucket: str, key: str) -> str:
        """Derive a canonical URL on the configured InsForge origin.

        Both bucket and key are encoded as path segments, matching the official
        InsForge Storage CLI. No caller-provided URL is ever accepted here.
        """
        base = urlsplit(self.settings.insforge_url)
        if (
            base.scheme not in {"http", "https"}
            or not base.hostname
            or base.username
            or base.password
        ):
            raise ValueError("INSFORGE_URL must be an absolute HTTP(S) origin")
        if not bucket or not key or key.startswith("/") or "\x00" in key:
            raise ValueError("Invalid Storage bucket or key")
        path = (
            f"/api/storage/buckets/{quote(bucket, safe='')}/objects/"
            f"{quote(key, safe='')}"
        )
        return urlunsplit((base.scheme, base.netloc, path, "", ""))

    async def download_storage_object(
        self, *, bucket: str, key: str, max_bytes: int = 25 * 1024 * 1024
    ) -> bytes:
        url = self.storage_object_url(bucket=bucket, key=key)
        async with httpx.AsyncClient(
            timeout=60,
            follow_redirects=False,
            transport=self.transport,
        ) as client:
            async with client.stream("GET", url, headers=self._headers()) as response:
                if response.is_error or response.is_redirect:
                    raise InsForgeError(response.status_code, "Storage download failed")
                content_length = response.headers.get("content-length")
                if content_length:
                    try:
                        if int(content_length) > max_bytes:
                            raise InsForgeError(413, "Storage object exceeds maximum size")
                    except ValueError:
                        pass
                content = bytearray()
                async for chunk in response.aiter_bytes():
                    content.extend(chunk)
                    if len(content) > max_bytes:
                        raise InsForgeError(413, "Storage object exceeds maximum size")
                return bytes(content)

    async def rpc(self, function: str, payload: dict[str, Any]) -> list[dict[str, Any]]:
        result = await self._database_request(
            "POST", f"rpc/{quote(function, safe='')}", json=payload
        )
        return result or []
