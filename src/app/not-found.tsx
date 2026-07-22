import Link from "next/link";

export default function NotFound() {
  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <h2 style={{ marginTop: 0 }}>Not found</h2>
        <p className="muted">
          This page or document doesn&apos;t exist, or you don&apos;t have access.
        </p>
        <Link className="btn btn-primary" href="/docs">
          Back to documents
        </Link>
      </div>
    </div>
  );
}
