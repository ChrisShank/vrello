import { Doc, Map as YMap, Array as YArray } from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

type DataIntention =
  | { type: 'UPDATE_BOARD_NAME'; name: string }
  | { type: 'ADD_COLUMN' }
  | { type: 'COLUMN_MOVED'; columnIndex: number; newColumnIndex: number }
  | { type: 'DELETE_COLUMN'; columnIndex: number }
  | { type: 'UPDATE_COLUMN_NAME'; columnIndex: number; name: string }
  | { type: 'ADD_CARD'; columnIndex: number }
  | { type: 'DELETE_CARD'; columnIndex: number; cardIndex: number }
  | { type: 'CARD_MOVED'; columnIndex: number; cardIndex: number; newColumnIndex: number; newCardIndex: number }
  | { type: 'UPDATE_CARD_NAME'; columnIndex: number; cardIndex: number; name: string }
  | { type: 'UPDATE_CARD_DESCRIPTION'; columnIndex: number; cardIndex: number; description: string };

export class KanbanStore {
  #doc = new Doc({ gc: true });
  #board;
  #idbProvider;
  // #room;

  constructor(roomId = 'my_board') {
    this.#idbProvider = new IndexeddbPersistence(roomId, this.#doc);
    this.#board = this.#doc.getMap(roomId);
    // this.#room = new WebsocketProvider(hostUrl, roomId, this.#doc, { connect: true })
    this.#instantiateBoard();
  }

  get name() {
    return this.#board.get('name') as string;
  }
  set name(name) {
    this.#board.set('name', name);
  }

  get columns() {
    return this.#board.get('columns') as YArray<YColumn>;
  }

  getColumn(columnIndex: number) {
    const column = this.columns.get(columnIndex);
    if (column === undefined) {
      throw new Error('invalid column index');
    }

    return column;
  }

  getCardsFromColumn(columnIndex: number) {
    return this.getColumn(columnIndex).get('cards') as YArray<YCard>;
  }

  handleIntention(intention: DataIntention) {
    switch (intention.type) {
      case 'UPDATE_BOARD_NAME': {
        this.name = intention.name;
        return;
      }
      case 'ADD_COLUMN': {
        this.columns.push([createYColumn()]);
        return;
      }
      case 'COLUMN_MOVED': {
        const column = this.getColumn(intention.columnIndex);
        this.columns.delete(intention.columnIndex);
        this.columns.insert(intention.newColumnIndex, [column]);
        return;
      }
      case 'DELETE_COLUMN': {
        this.columns.delete(intention.columnIndex);
        return;
      }
      case 'UPDATE_COLUMN_NAME': {
        const column = this.getColumn(intention.columnIndex);
        column.set('name', intention.name);
        return;
      }
      case 'ADD_CARD': {
        const cards = this.getCardsFromColumn(intention.columnIndex);
        cards.push([createYCard()]);
        return;
      }
      case 'DELETE_CARD': {
        const cards = this.getCardsFromColumn(intention.columnIndex);
        cards.delete(intention.cardIndex);
        return;
      }
      case 'CARD_MOVED': {
        const isSameColumn = intention.columnIndex === intention.newColumnIndex;

        if (isSameColumn && intention.cardIndex === intention.newCardIndex) return;

        const cards = this.getCardsFromColumn(intention.columnIndex);
        const card = cards.get(intention.cardIndex);
        cards.delete(intention.cardIndex);
        const newCards = isSameColumn ? cards : this.getCardsFromColumn(intention.newColumnIndex);
        newCards.insert(intention.newCardIndex, [card]);
        return;
      }
      case 'UPDATE_CARD_NAME': {
        const cards = this.getCardsFromColumn(intention.columnIndex);
        const card = cards.get(intention.cardIndex);
        card.set('name', intention.name);
        return;
      }
      case 'UPDATE_CARD_DESCRIPTION': {
        const cards = this.getCardsFromColumn(intention.columnIndex);
        const card = cards.get(intention.cardIndex);
        card.set('description', intention.description);
        return;
      }
    }
  }

  // Wait for IndexDB
  async #instantiateBoard() {
    await this.#idbProvider.whenSynced;

    if (this.#board.size === 0) {
      this.#board.set('id', crypto.randomUUID());
      this.name = '';
      this.#board.set('columns', new YArray<YColumn>());
    }

    this.#board.observe((e) => console.log(e, e.changes));
  }
}

type YColumn = ReturnType<typeof createYColumn>;

export function createYColumn() {
  const column = new YMap<string | YArray<YCard>>();
  column.set('id', crypto.randomUUID());
  column.set('name', '');
  column.set('cards', new YArray<YCard>());
  return column;
}

type YCard = ReturnType<typeof createYCard>;

export function createYCard() {
  const card = new YMap<string>();
  card.set('id', crypto.randomUUID());
  card.set('name', '');
  card.set('description', '');
  return card;
}
