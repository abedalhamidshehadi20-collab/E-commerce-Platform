function buildPaginationItems(currentPage, totalPages) {
  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const normalizedPages = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);

  const items = [];

  normalizedPages.forEach((page, index) => {
    if (index > 0 && page - normalizedPages[index - 1] > 1) {
      items.push({
        type: "ellipsis",
        key: `ellipsis-${normalizedPages[index - 1]}-${page}`,
      });
    }

    items.push({
      type: "page",
      key: `page-${page}`,
      value: page,
    });
  });

  return items;
}

function PaginationArrow({ direction = "left" }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d={direction === "left" ? "M11.75 4.75 6.5 10l5.25 5.25" : "M8.25 4.75 13.5 10l-5.25 5.25"}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) {
    return null;
  }

  const items = buildPaginationItems(currentPage, totalPages);

  return (
    <nav className="pagination" aria-label="Pagination">
      <div className="pagination-meta">
        <span className="pagination-label">Page navigation</span>
        <strong>
          {currentPage} of {totalPages}
        </strong>
      </div>

      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-button pagination-button-nav"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Go to previous page"
        >
          <PaginationArrow direction="left" />
          <span>Previous</span>
        </button>

        <div className="pagination-pages" aria-label="Pages">
          {items.map((item) =>
            item.type === "ellipsis" ? (
              <span key={item.key} className="pagination-ellipsis" aria-hidden="true">
                ...
              </span>
            ) : (
              <button
                key={item.key}
                type="button"
                className={`pagination-button pagination-button-page ${
                  item.value === currentPage ? "active" : ""
                }`.trim()}
                onClick={() => onPageChange(item.value)}
                aria-current={item.value === currentPage ? "page" : undefined}
                aria-label={`Go to page ${item.value}`}
              >
                {item.value}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          className="pagination-button pagination-button-nav"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Go to next page"
        >
          <span>Next</span>
          <PaginationArrow direction="right" />
        </button>
      </div>
    </nav>
  );
}
