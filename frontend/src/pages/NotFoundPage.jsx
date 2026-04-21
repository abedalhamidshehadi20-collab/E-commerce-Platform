import { Link } from "react-router-dom";

import Button from "../components/Button";
import useDocumentTitle from "../hooks/useDocumentTitle";

export default function NotFoundPage() {
  useDocumentTitle("Not found");

  return (
    <section className="container section narrow">
      <div className="empty-state">
        <h1>We couldn’t find that page.</h1>
        <p>The page may have moved, or the address may be incorrect.</p>
        <Link to="/">
          <Button>Back to home</Button>
        </Link>
      </div>
    </section>
  );
}
