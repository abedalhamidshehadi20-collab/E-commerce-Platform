import { useEffect } from "react";

export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | Northstar Commerce` : "Northstar Commerce";
  }, [title]);
}
