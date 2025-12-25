import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      textAlign: "center"
    }}>
      <h1 style={{
        fontSize: "3rem",
        color: "var(--primary)",
        marginBottom: "1rem",
        textShadow: "0 0 20px var(--accent)"
      }}>
        404
      </h1>
      <h2 style={{
        fontWeight: 400,
        color: "var(--text)",
        marginBottom: "1.5rem"
      }}>
        Oops! Page Not Found
      </h2>
      <p style={{
        color: "var(--text)",
        marginBottom: "2rem"
      }}>
        The page you are looking for doesn’t exist or has been moved.<br />
        Try heading back to the homepage or explore the site!
      </p>
      <Link href="/">
        <span style={{
          background: "var(--primary)",
          color: "#fff",
          padding: "0.75rem 2rem",
          borderRadius: "2rem",
          fontWeight: 500,
          fontSize: "1.1rem",
          boxShadow: "0 0 20px var(--secondary)",
          textDecoration: "none",
          transition: "background 0.2s"
        }}>
          Go Home
        </span>
      </Link>
    </div>
  );
}
