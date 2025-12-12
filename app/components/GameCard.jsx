import Link from "next/link";

export default function GameCard({ title, link }) {
  return (
    <div style={{
      border: "1px solid #ccc",
      borderRadius: "10px",
      padding: "20px",
      marginTop: "20px"
    }}>
      <h2>{title}</h2>
      <Link href={link}>Play →</Link>
    </div>
  );
}
