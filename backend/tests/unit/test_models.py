from uuid import uuid4

import pytest
from pydantic import ValidationError

from aristoteles_api.domain.models import (
    AuthContext,
    DocumentPage,
    QuestionRequest,
    TextDocumentCreate,
)


def test_document_rejects_duplicate_pages() -> None:
    with pytest.raises(ValidationError):
        TextDocumentCreate(
            name="quote.pdf",
            pages=[DocumentPage(page=1, text="one"), DocumentPage(page=1, text="two")],
        )


def test_document_rejects_blank_page() -> None:
    with pytest.raises(ValidationError):
        DocumentPage(page=1, text="   ")


def test_document_rejects_page_number_below_one() -> None:
    with pytest.raises(ValidationError):
        DocumentPage(page=0, text="content")


@pytest.mark.parametrize("top_k", [0, 11])
def test_question_rejects_top_k_outside_supported_range(top_k: int) -> None:
    with pytest.raises(ValidationError):
        QuestionRequest(question="What is the warranty?", top_k=top_k)


def test_question_rejects_more_than_4000_characters() -> None:
    with pytest.raises(ValidationError):
        QuestionRequest(question="x" * 4001)


def test_question_defaults_to_five_results() -> None:
    request = QuestionRequest(question="What is the warranty?")

    assert request.top_k == 5


def test_auth_context_repr_hides_token() -> None:
    context = AuthContext(user_id=uuid4(), access_token="secret-jwt")

    assert "secret-jwt" not in repr(context)
