from urllib.parse import urlparse

from aristoteles.config import Settings
from aristoteles.insforge import InsForgeRepository


def test_storage_download_url_is_derived_from_insforge_host_and_key() -> None:
    settings = Settings(
        INSFORGE_URL="https://project.us-east.insforge.app",
        INSFORGE_API_KEY="secret",
    )
    repository = InsForgeRepository(settings, access_token="user-token")

    url = repository.storage_object_url(
        bucket="case-documents",
        key="owner/case/propuesta final.pdf",
    )

    parsed = urlparse(url)
    assert parsed.netloc == "project.us-east.insforge.app"
    assert parsed.path == (
        "/api/storage/buckets/case-documents/objects/"
        "owner%2Fcase%2Fpropuesta%20final.pdf"
    )
    assert "evil.example" not in url
