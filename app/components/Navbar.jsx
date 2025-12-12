import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div><b>GamesApp</b></div>
      <div className="nav-links">
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/games">Games</Link>
      </div>
    </nav>
  );
}
