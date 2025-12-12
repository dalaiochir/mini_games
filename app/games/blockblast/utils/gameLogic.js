// Utilities: pieces generation, placement, clearing, move-check
let nextId = 1;

const COLOR_PALETTE = [
  "#60a5fa","#f97316","#34d399","#f43f5e","#eab308","#a78bfa","#fb7185","#38bdf8"
];

function randColor() {
  return COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
}

export function createEmptyBoard(n = 9) {
  // board cells: { occupied: bool, color: string } or null/empty object
  return Array.from({ length: n }, () => Array.from({ length: n }, () => ({ occupied: false })));
}

// basic shapes requested: single, domino (2x1), L, T, square 2x2 and 3x3, line 1x4 and 1x5
const SHAPES_RAW = [
  // single
  [[0,0]],
  // domino horizontal (we will normalize orientation so dominos can appear both ways via coords)
  [[0,0],[1,0]],
  // L small (2x2 L)
  [[0,0],[0,1],[1,1]],
  // T shape (3 wide)
  [[0,1],[1,1],[2,1],[1,0]],
  // square 2x2
  [[0,0],[1,0],[0,1],[1,1]],
  // square 3x3 (full)
  [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]],
  // line 1x4
  [[0,0],[1,0],[2,0],[3,0]],
  // line 1x5
  [[0,0],[1,0],[2,0],[3,0],[4,0]],
  // L longer
  [[0,0],[0,1],[0,2],[1,2]],
];

function normalize(shape) {
  const xs = shape.map((s) => s[0]);
  const ys = shape.map((s) => s[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const norm = shape.map(([x,y]) => [x - minX, y - minY]);
  const w = Math.max(...norm.map(([x]) => x)) + 1;
  const h = Math.max(...norm.map(([_,y]) => y)) + 1;
  return { cells: norm, w, h };
}

export function generatePieces(count = 3) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const raw = SHAPES_RAW[Math.floor(Math.random() * SHAPES_RAW.length)];
    const { cells, w, h } = normalize(raw);
    out.push({
      id: nextId++,
      cells, // array of [x,y]
      w,
      h,
      color: randColor(),
    });
  }
  return out;
}

export function canPlaceShape(board, piece, x, y) {
  const n = board.length;
  for (const [px, py] of piece.cells) {
    const bx = x + px;
    const by = y + py;
    if (bx < 0 || by < 0 || bx >= n || by >= n) return false;
    if (board[by][bx].occupied) return false;
  }
  return true;
}

export function applyPieceToBoard(board, piece, x, y) {
  const n = board.length;
  const b2 = board.map((row) => row.map((c) => ({ ...c })));
  for (const [px, py] of piece.cells) {
    const bx = x + px;
    const by = y + py;
    b2[by][bx].occupied = true;
    b2[by][bx].color = piece.color;
  }
  return b2;
}

// Finds rows and cols full, returns board after cleared, plus list of coords cleared and counts
export function findClearsAndClearWithAnimation(board) {
  const n = board.length;
  const toClearSet = new Set();
  const rows = [];
  const cols = [];

  // rows
  for (let y = 0; y < n; y++) {
    if (board[y].every((c) => c.occupied)) {
      rows.push(y);
      for (let x = 0; x < n; x++) toClearSet.add(`${y}-${x}`);
    }
  }
  // cols
  for (let x = 0; x < n; x++) {
    let full = true;
    for (let y = 0; y < n; y++) if (!board[y][x].occupied) full = false;
    if (full) {
      cols.push(x);
      for (let y = 0; y < n; y++) toClearSet.add(`${y}-${x}`);
    }
  }

  if (toClearSet.size === 0) {
    return { boardAfterClear: board, clearCoords: [], counts: { rows: 0, cols: 0 } };
  }

  // prepare boardAfterClear
  const boardAfterClear = board.map((row) => row.map((c) => ({ ...c })));
  for (const key of toClearSet) {
    const [y,x] = key.split("-").map(Number);
    boardAfterClear[y][x] = { occupied: false };
  }

  const clearCoords = Array.from(toClearSet); // strings "r-c"
  return { boardAfterClear, clearCoords, counts: { rows: rows.length, cols: cols.length } };
}

// Check whether there exists any valid placement for ANY of the pieces on current board
// pieces: array (some may be null)
export function hasAnyValidMove(board, pieces, n = 9) {
  const available = pieces.filter(Boolean);
  if (available.length === 0) return true; // next generation will come
  for (const p of available) {
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (canPlaceShape(board, p, x, y)) return true;
      }
    }
  }
  return false;
}
