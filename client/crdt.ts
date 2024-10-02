import { Doc } from 'yjs';
import { YKeyValue } from 'y-utility/y-keyvalue';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

export interface CardRecord {
  name: string;
  description: string;
}

export interface ColumnRecord {
  name: string;
  cards: string[];
}

export interface BoardRecord {
  name: string;
  columns: string[];
}

type Record = CardRecord | ColumnRecord | BoardRecord;

type Changes<T> = Map<
  string,
  { action: 'delete'; oldValue: T } | { action: 'update'; oldValue: T; newValue: T } | { action: 'add'; newValue: T }
>;

const roomId = 'my_board';
const hostUrl = import.meta.env.MODE === 'development' ? 'ws://localhost:1234' : 'wss://demos.yjs.dev';
const yDoc = new Doc({ gc: true });
const yArr = yDoc.getArray<{ key: string; val: Record }>(roomId);
const yStore = new YKeyValue(yArr);
const idbProvider = new IndexeddbPersistence(roomId, yDoc);
// const room = new WebsocketProvider(hostUrl, roomId, yDoc, { connect: true });

yStore.on('change', (changes: Changes<Record>) => {
  console.log(changes);
});

window.crdt = yStore;
