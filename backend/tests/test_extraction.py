import fitz

from aristoteles.extraction import extract_pdf


def test_native_pdf_text_is_extracted_without_ocr() -> None:
    document = fitz.open()
    page = document.new_page()
    text = "\n".join(
        f"Proveedor A ofrece garantía de 24 meses y entrega en 5 días, referencia {index}."
        for index in range(30)
    )
    page.insert_textbox((40, 40, 550, 780), text, fontsize=8)
    pages = extract_pdf(document.tobytes())

    assert len(pages) == 1
    assert pages[0].method == "native"
    assert "Proveedor A" in pages[0].text
    assert pages[0].quality_score > 0.25
