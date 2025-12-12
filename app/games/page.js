import GameCard from "../components/GameCard";

export default function Games() {
  return (
    <div>
      <h1>Games</h1>
      <GameCard title="Snake" link="/games/snake" />
      <GameCard title="Puzzle" link="/games/puzzle" />
      <GameCard title="Block Blast" link="/games/blockblast" />
    </div>
  );
}
