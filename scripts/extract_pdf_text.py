import sys
from pathlib import Path


def load_reader():
    try:
        from pypdf import PdfReader  # type: ignore
        return PdfReader
    except Exception:
        pass
    try:
        from PyPDF2 import PdfReader  # type: ignore
        return PdfReader
    except Exception:
        pass
    return None


def main():
    if len(sys.argv) < 2:
        print("usage: python scripts/extract_pdf_text.py <pdf-path> [max-pages]", file=sys.stderr)
        sys.exit(2)

    pdf_path = Path(sys.argv[1].strip().strip('"').strip("'"))
    max_pages = int(sys.argv[2]) if len(sys.argv) > 2 else 12
    output_path = Path(sys.argv[3]) if len(sys.argv) > 3 else None
    reader_cls = load_reader()
    if reader_cls is None:
      print("NO_PDF_READER")
      sys.exit(3)

    reader = reader_cls(str(pdf_path))
    total = len(reader.pages)
    pages = min(total, max_pages)
    chunks = [
        f"FILE: {pdf_path}",
        f"PAGES: {total}",
        "=" * 80,
    ]
    for i in range(pages):
        try:
            text = reader.pages[i].extract_text() or ""
        except Exception as exc:
            text = f"[PAGE {i + 1} EXTRACT ERROR] {exc}"
        chunks.append(f"\n--- PAGE {i + 1} ---\n")
        chunks.append(text.strip())

    final_text = "\n".join(chunks)
    if output_path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(final_text, encoding="utf-8")
        print(str(output_path))
    else:
        sys.stdout.buffer.write(final_text.encode("utf-8", errors="ignore"))


if __name__ == "__main__":
    main()
