"use client";

import { TTS_DOC_FILENAME, TTS_DOC_MD } from "./content";

export default function DownloadMarkdown() {
  function download() {
    const blob = new Blob([TTS_DOC_MD], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = TTS_DOC_FILENAME;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button type="button" className="secondary sm" onClick={download}>
      ⬇ Download Markdown
    </button>
  );
}
