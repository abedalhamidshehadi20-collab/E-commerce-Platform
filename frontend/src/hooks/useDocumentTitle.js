import { useEffect } from "react";

export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | A-SH` : "A-SH";
  }, [title]);
}
