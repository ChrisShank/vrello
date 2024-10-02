export interface Card {
  id: string;
  name: string;
  description: string;
}

export interface Column {
  id: string;
  name: string;
  cards: Card[];
}

export interface Board {
  id: string;
  name: string;
  columns: Column[];
}

export declare function renderBoard(board: Board): string;

export function renderColumn(column: Column): string;

export function renderCard(card: Card): string;
