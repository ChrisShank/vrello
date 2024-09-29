export type UUID = ReturnType<Crypto['randomUUID']>;

export interface Card {
  id: UUID;
  name: string;
  description: string;
}

export interface Column {
  id: UUID;
  name: string;
  cards: Card[];
}

export interface Board {
  id: UUID;
  name: string;
  columns: Column[];
}

export declare function renderBoard(board: Board): string;

export function renderColumn(column: Column): string;

export function renderCard(card: Card): string;
