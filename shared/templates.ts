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

export function renderBoard({ id, name, columns }: Board) {
  return `
<kanban-board data-id="${id}">
  <h2><input value="${name}" on-change="UPDATE_BOARD_NAME" /></h2>
  <label for="filter">Filter: <input value="" name="filter" id="filter" on-input="FILTER_CARDS" /></label>
  <button on-click="ADD_COLUMN">Add Column</button>
  <ul>${columns.map((column) => renderColumn(column)).join('')}</ul>
</kanban-board>`;
}

export function renderColumn({ id, name, cards }: Column) {
  return `
<kanban-column 
  role="listitem" 
  data-id="${id}" 
  draggable="true" 
  on-dragstart="START_DRAGGING_COLUMN" 
  on-dragend="STOP_DRAGGING_COLUMN"
  on-dragover="DRAGGING_OVER_COLUMN"
  on-dragleave="DRAG_LEAVING_COLUMN"
  on-drop="DROPPING_ON_COLUMN"
  >
  <input value="${name}" name="name" on-change="UPDATE_COLUMN_NAME" />
  <ul>${cards.map((card) => renderCard(card)).join('')}</ul>
  <button on-click="ADD_CARD">Add Item</button>
</kanban-column>`;
}

export function renderCard({ id, name, description }: Card) {
  return `
<kanban-card 
  role="listitem" data-id="${id}" 
  draggable="true" 
  on-dragstart="START_DRAGGING_CARD" 
  on-dragend="STOP_DRAGGING_CARD"
  on-dragover="DRAGGING_OVER_CARD"
  on-dragleave="DRAG_LEAVING_CARD"
  on-drop="DROPPING_ON_CARD"
>
  <input value="${name}" />
  <button on-click="DELETE_CARD">Delete</button>
  <textarea
    placeholder="Add a description"
    on-change="UPDATE_CARD_DESCRIPTION"
  >${description}</textarea>
</kanban-card>`;
}
