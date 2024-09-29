/**
 * Given a DOM event this utility function finds the closest intention. An intention is a DOM attribute that maps a DOM event to a semantically meaningful event. The attribute takes the shape `${prefix}${event.type}${modifiers?}="${semantic event}"`.
 * @param event DOM event
 * @param modifier A function that adds a modifier to the intention. Useful for keyboard modifiers.
 * @param prefix By default intentions are prefixed with `on:`, use this to override that prefix.
 * @returns
 */
function findClosestIntention(event) {
  if (event.target instanceof Element) {
    const attributeName = `on:${event.type}`;
    const target = event.target.closest(`[${attributeName}]`);
    if (target !== null) {
      const intention = target.getAttribute(attributeName);
      return { intention, target };
    }
  }

  return {};
}

class ProgressiveElement extends HTMLElement {
  static tagName = '';

  /**
   * Register the custom element with the window. By default then name of the custom element is the kebab-case of the class name.
   */
  static register() {
    customElements.define(this.tagName, this);
  }

  /**
   * A list of event types to be delegated for the lifetime of the custom element.
   */
  static delegatedEvents;

  constructor() {
    super();

    const constructor = this.constructor;
    constructor.delegatedEvents?.forEach((event) => this.addEventListener(event, this));
  }

  /**
   * This method is called any time an event is delegated. It's a central handler to handle events for this custom element. No need to call `super.handleEvent()`.
   * @param event
   */
  handleEvent(event) {}
}

const parser = new DOMParser();
function parseHTML(html) {
  return document.createRange().createContextualFragment(html).firstElementChild;
}

function renderBoard({ id, name, columns }) {
  return `
<kanban-board data-id="${id}">
  <h2><input value="${name}" on:change="UPDATE_BOARD_NAME" /></h2>
  <label for="filter">Filter: <input value="" name="filter" id="filter" on:input="FILTER_CARDS" /></label>
  <button on:click="ADD_COLUMN">Add Column</button>
  <ul>${columns.map((column) => renderColumn(column)).join('')}</ul>
</kanban-board>`;
}

function renderColumn({ id, name, cards }) {
  return `
<kanban-column 
  role="listitem" 
  data-id="${id}" 
  draggable="true" 
  on:dragstart="START_DRAGGING_COLUMN" 
  on:dragend="STOP_DRAGGING_COLUMN"
  on:dragover="DRAGGING_OVER_COLUMN"
  on:dragleave="DRAG_LEAVING_COLUMN"
  on:drop="DROPPING_ON_COLUMN"
  >
  <input value="${name}" name="name" on:change="UPDATE_COLUMN_NAME" />
  <ul>${cards.map((card) => renderCard(card)).join('')}</ul>
  <button on:click="ADD_CARD">Add Item</button>
</kanban-column>`;
}

function renderCard({ id, name, description }) {
  return `
<kanban-card 
  role="listitem" data-id="${id}" 
  draggable="true" 
  on:dragstart="START_DRAGGING_CARD" 
  on:dragend="STOP_DRAGGING_CARD"
  on:dragover="DRAGGING_OVER_CARD"
  on:dragleave="DRAG_LEAVING_CARD"
  on:drop="DROPPING_ON_CARD"
>
  <input value="${name}" />
  <button on:click="DELETE_CARD">Delete</button>
  <textarea
    placeholder="Add a description"
    on:change="UPDATE_CARD_DESCRIPTION"
  >${description}</textarea>
</kanban-card>`;
}

const CONTENT_TYPES = {
  COLUMN: 'text/kanban-column',
  CARD: 'text/kanban-card',
};

class KanbanBoard extends ProgressiveElement {
  static tagName = 'kanban-board';

  static delegatedEvents = ['click', 'change', 'input', 'dragstart', 'dragend', 'dragover', 'dragleave', 'drop'];

  #ul = this.querySelector('ul');

  #id = this.dataset.id;
  get id() {
    return this.#id;
  }

  #input = this.querySelector('h2 input');
  get name() {
    return this.#input.value;
  }
  set name(name) {
    this.#input.value = name;
  }

  #filterInput = this.querySelector('input[name="filter"]');
  get filter() {
    return this.#filterInput.value;
  }
  set filter(filter) {
    this.#filterInput.value = name;
  }

  handleEvent(event) {
    const { intention, target } = findClosestIntention(event);

    switch (intention) {
      case 'UPDATE_BOARD_NAME': {
        return;
      }
      case 'ADD_COLUMN': {
        this.addColumn({ id: crypto.randomUUID(), name: '', cards: [] });
        return;
      }
      case 'FILTER_CARDS': {
        const filter = this.filter.toLowerCase();
        this.querySelectorAll('kanban-card').forEach((card) => {
          card.hidden = !(card.name.toLowerCase().includes(filter) || card.description.toLowerCase().includes(filter));
        });
        return;
      }
      case 'UPDATE_CARD_NAME': {
        return;
      }
      case 'UPDATE_CARD_DESCRIPTION': {
        return;
      }
      case 'DELETE_CARD': {
        const card = target.closest(KanbanCard.tagName);
        card.remove();
        return;
      }
      case 'START_DRAGGING_CARD': {
        document.activeElement?.blur();
        const card = target.closest(KanbanCard.tagName);
        card.dragging = true;
        event.dataTransfer.setData(CONTENT_TYPES.CARD, card.id);
        event.dataTransfer.effectAllowed = 'move';
        return;
      }
      case 'STOP_DRAGGING_CARD': {
        const card = target.closest(KanbanCard.tagName);
        card.dragging = false;
        return;
      }
      case 'DRAGGING_OVER_CARD': {
        if (event.dataTransfer.types.includes(CONTENT_TYPES.CARD)) {
          const card = target.closest(KanbanCard.tagName);
          event.preventDefault();
          event.stopPropagation();
          let rect = card.getBoundingClientRect();
          let midpoint = rect.top + rect.height / 2;
          card.acceptDrop = event.clientY <= midpoint ? 'accept-card-above' : 'accept-card-below';
        }
        return;
      }
      case 'DRAG_LEAVING_CARD': {
        if (event.dataTransfer.types.includes(CONTENT_TYPES.CARD)) {
          const card = target.closest(KanbanCard.tagName);
          card.acceptDrop = 'none';
        }
        return;
      }
      case 'DROPPING_ON_CARD': {
        if (event.dataTransfer.types.includes(CONTENT_TYPES.CARD)) {
          const card = target.closest(KanbanCard.tagName);
          const id = event.dataTransfer.getData(CONTENT_TYPES.CARD);
          const droppedCard = document.querySelector(`[data-id="${id}"]`);
          card.insertAdjacentElement(card.acceptDrop === 'accept-card-above' ? 'beforeBegin' : 'afterEnd', droppedCard);
          card.acceptDrop = 'none';
        }
        return;
      }
      case 'UPDATE_COLUMN_NAME': {
        return;
      }
      case 'ADD_CARD': {
        const column = target.closest(KanbanColumn.tagName);
        column.addCard({ id: crypto.randomUUID(), name: '', description: '' });
        return;
      }
      case 'START_DRAGGING_COLUMN': {
        const column = target.closest(KanbanColumn.tagName);
        column.dragging = true;
        event.dataTransfer.setData(CONTENT_TYPES.COLUMN, column.id);
        event.dataTransfer.effectAllowed = 'move';
        return;
      }
      case 'STOP_DRAGGING_COLUMN': {
        const column = target.closest(KanbanColumn.tagName);
        column.dragging = false;
        return;
      }
      case 'DRAGGING_OVER_COLUMN': {
        const column = target.closest(KanbanColumn.tagName);
        if (event.dataTransfer.types.includes(CONTENT_TYPES.CARD)) {
          event.preventDefault();
          event.stopPropagation();
          column.acceptDrop = 'accept-card';
        } else if (event.dataTransfer.types.includes(CONTENT_TYPES.COLUMN)) {
          event.preventDefault();
          event.stopPropagation();
          let rect = column.getBoundingClientRect();
          let midpoint = rect.left + rect.width / 2;
          column.acceptDrop = event.clientX <= midpoint ? 'accept-column-left' : 'accept-column-right';
        }
        return;
      }
      case 'DRAG_LEAVING_COLUMN': {
        const column = target.closest(KanbanColumn.tagName);
        if (event.dataTransfer.types.includes(CONTENT_TYPES.CARD)) {
          column.acceptDrop = 'none';
        } else if (event.dataTransfer.types.includes(CONTENT_TYPES.COLUMN)) {
          column.acceptDrop = 'none';
        }
        return;
      }
      case 'DROPPING_ON_COLUMN': {
        const column = target.closest(KanbanColumn.tagName);
        if (event.dataTransfer.types.includes(CONTENT_TYPES.CARD)) {
          event.stopPropagation();
          const id = event.dataTransfer.getData(CONTENT_TYPES.CARD);
          const card = document.querySelector(`[data-id="${id}"]`);
          column.appendCard(card);
          column.acceptDrop = 'none';
        } else if (event.dataTransfer.types.includes(CONTENT_TYPES.COLUMN)) {
          event.stopPropagation();
          const id = event.dataTransfer.getData(CONTENT_TYPES.COLUMN);
          const droppedColumn = document.querySelector(`[data-id="${id}"]`);
          column.insertAdjacentElement(
            column.acceptDrop === 'accept-column-left' ? 'beforeBegin' : 'afterEnd',
            droppedColumn
          );
          column.acceptDrop = 'none';
        }
        return;
      }
    }
  }

  addColumn(column) {
    const newColumn = parseHTML(renderColumn(column));
    this.#ul.appendChild(newColumn);
    newColumn.focusName();
  }

  focusName() {
    this.#input.focus();
  }

  toJSON() {
    const columns = Array.from(this.querySelectorAll('kanban-column')).map((column) => column.toJSON());
    return { id: this.id, name: this.name, columns };
  }
}

class KanbanColumn extends ProgressiveElement {
  static tagName = 'kanban-column';

  #internals = this.attachInternals();

  #ul = this.querySelector('ul');

  #id = this.dataset.id;
  get id() {
    return this.#id;
  }

  #input = this.querySelector('input');
  get name() {
    return this.#input.value;
  }
  set name(name) {
    this.#input.value = name;
  }

  #dragging = false;
  get dragging() {
    return this.#dragging;
  }
  set dragging(dragging) {
    this.#dragging = dragging;
    this.#dragging ? this.#internals.states.add('dragging') : this.#internals.states.delete('dragging');
  }

  #acceptDrop = 'none';
  get acceptDrop() {
    return this.#acceptDrop;
  }
  set acceptDrop(acceptDrop) {
    if (acceptDrop === this.#acceptDrop) return;

    if (this.#acceptDrop !== 'none') {
      this.#internals.states.delete(this.#acceptDrop);
    }

    this.#acceptDrop = acceptDrop;

    if (this.#acceptDrop !== 'none') {
      this.#internals.states.add(this.#acceptDrop);
    }
  }

  addCard(card) {
    const newCard = parseHTML(renderCard(card));
    this.appendCard(newCard);
    newCard.focusName();
  }

  appendCard(cardElement) {
    this.#ul.appendChild(cardElement);
  }

  focusName() {
    this.#input.focus();
  }

  toJSON() {
    const cards = Array.from(this.querySelectorAll('kanban-card')).map((card) => card.toJSON());
    return { id: this.id, name: this.name, cards };
  }
}

class KanbanCard extends ProgressiveElement {
  static tagName = 'kanban-card';

  #internals = this.attachInternals();

  #id = this.dataset.id || '';
  get id() {
    return this.#id;
  }

  #input = this.querySelector('input');
  get name() {
    return this.#input.value;
  }
  set name(name) {
    this.#input.value = name;
  }

  #textarea = this.querySelector('textarea');
  get description() {
    return this.#textarea.value;
  }
  set description(description) {
    this.#textarea.value = description;
  }

  #acceptDrop = 'none';
  get acceptDrop() {
    return this.#acceptDrop;
  }
  set acceptDrop(acceptDrop) {
    if (acceptDrop === this.#acceptDrop) return;

    if (this.#acceptDrop !== 'none') {
      this.#internals.states.delete(this.#acceptDrop);
    }

    this.#acceptDrop = acceptDrop;

    if (this.#acceptDrop !== 'none') {
      this.#internals.states.add(this.#acceptDrop);
    }
  }

  #dragging = false;
  get dragging() {
    return this.#dragging;
  }
  set dragging(dragging) {
    this.#dragging = dragging;
    this.#dragging ? this.#internals.states.add('dragging') : this.#internals.states.delete('dragging');
  }

  focusName() {
    this.#input.focus();
  }

  toJSON() {
    return { id: this.id, name: this.name, description: this.description };
  }
}

KanbanBoard.register();
KanbanColumn.register();
KanbanCard.register();

document.body.appendChild(
  parseHTML(
    renderBoard({
      id: crypto.randomUUID(),
      name: 'Board 1',
      columns: [
        {
          id: crypto.randomUUID(),
          name: 'Col 1',
          cards: [
            {
              id: crypto.randomUUID(),
              name: 'Card 1.1',
              description: 'Something informative.',
            },
            { id: crypto.randomUUID(), name: 'Card 1.2', description: 'Something else' },
            { id: crypto.randomUUID(), name: 'Card 1.3', description: 'Some thing' },
          ],
        },
        {
          id: crypto.randomUUID(),
          name: 'Col 2',
          cards: [
            { id: crypto.randomUUID(), name: 'Card 2.1', description: 'foo bar' },
            { id: crypto.randomUUID(), name: 'Card 2.2', description: 'foo baz' },
            { id: crypto.randomUUID(), name: 'Card 2.3', description: 'bar bar' },
            { id: crypto.randomUUID(), name: 'Card 2.4', description: 'foo baz bar' },
            { id: crypto.randomUUID(), name: 'Card 2.5', description: 'foo bar' },
            { id: crypto.randomUUID(), name: 'Card 2.6', description: 'foo baz' },
            { id: crypto.randomUUID(), name: 'Card 2.7', description: 'bar bar' },
            { id: crypto.randomUUID(), name: 'Card 2.8', description: 'foo baz bar' },
            { id: crypto.randomUUID(), name: 'Card 2.9', description: 'foo baz bar' },
            { id: crypto.randomUUID(), name: 'Card 2.10', description: 'foo baz bar' },
            { id: crypto.randomUUID(), name: 'Card 2.11', description: 'foo baz bar' },
          ],
        },
        {
          id: crypto.randomUUID(),
          name: 'Col 3',
          cards: [],
        },
      ],
    })
  )
);
