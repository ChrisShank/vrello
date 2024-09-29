export function renderBoard({ id, name, columns }) {
  return `
<kanban-board data-id="${id}">
  <h2><input value="${name}" on-change="UPDATE_BOARD_NAME" /></h2>
  <label for="filter">Filter: <input value="" name="filter" id="filter" on-input="FILTER_CARDS" /></label>
  <button on-click="ADD_COLUMN">Add Column</button>
  <ul>${columns.map((column) => renderColumn(column)).join('')}</ul>
</kanban-board>`;
}

export function renderColumn({ id, name, cards }) {
  return `
<kanban-column 
  role="listitem" 
  data-id="${id}" 
  draggable="true"
  tabindex="0"
  on-dragstart="START_DRAGGING_COLUMN" 
  on-dragend="STOP_DRAGGING_COLUMN"
  on-dragover="DRAGGING_OVER_COLUMN"
  on-dragleave="DRAG_LEAVING_COLUMN"
  on-drop="DROPPING_ON_COLUMN"
  on-keyup.ArrowRight="MOVE_COLUMN_RIGHT"
  on-keyup.ArrowLeft="MOVE_COLUMN_LEFT"
  >
  <input value="${name}" name="name" on-change="UPDATE_COLUMN_NAME" />
  <ul>${cards.map((card) => renderCard(card)).join('')}</ul>
  <button on-click="ADD_CARD">Add Item</button>
</kanban-column>`;
}

export function renderCard({ id, name, description }) {
  return `
<kanban-card 
  role="listitem" data-id="${id}" 
  draggable="true"
  tabindex="0"
  on-dragstart="START_DRAGGING_CARD" 
  on-dragend="STOP_DRAGGING_CARD"
  on-dragover="DRAGGING_OVER_CARD"
  on-dragleave="DRAG_LEAVING_CARD"
  on-drop="DROPPING_ON_CARD"
  on-keyup.ArrowUp="MOVE_CARD_UP"
  on-keyup.ArrowDown="MOVE_CARD_DOWN"
  on-keyup.ArrowRight="MOVE_CARD_RIGHT"
  on-keyup.ArrowLeft="MOVE_CARD_LEFT"
>
  <input value="${name}" />
  <button on-click="DELETE_CARD">Delete</button>
  <textarea
    placeholder="Add a description"
    on-change="UPDATE_CARD_DESCRIPTION"
  >${description}</textarea>
</kanban-card>`;
}
