import { Doc } from 'yjs';
import { YKeyValue } from 'y-utility/y-keyvalue';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

export interface CardRecord {
  type: 'card';
  name: string;
  description: string;
}

export interface ColumnRecord {
  type: 'column';
  name: string;
  cards: string[];
}

export interface BoardRecord {
  type: 'board';
  name: string;
  columns: string[];
}

type Record = CardRecord | ColumnRecord | BoardRecord;

type Changes<T> = Map<
  string,
  { action: 'delete'; oldValue: T } | { action: 'update'; oldValue: T; newValue: T } | { action: 'add'; newValue: T }
>;

export class KanbanStore {
  #roomId: string;
  #doc = new Doc({ gc: true });
  #store;
  #idbProvider;
  // #room;

  constructor(roomId = 'my_board', hostUrl: string) {
    this.#roomId = roomId;

    const array = this.#doc.getArray<{ key: string; val: Record }>(this.#roomId);

    this.#store = new YKeyValue(array);

    this.#idbProvider = new IndexeddbPersistence(roomId, this.#doc);

    // this.#room = new WebsocketProvider(hostUrl, roomId, this.#doc, { connect: true })

    this.#store.on('change', (changes: Changes<Record>) => {
      console.log(changes);
    });
  }
}
