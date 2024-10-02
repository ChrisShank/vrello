import { renderColumn, renderCard, Card, Column, Board } from '../shared/templates';
import { closestSibling, findClosestIntention, parseHTML, ProgressiveElement } from './utils';

const CONTENT_TYPES = {
  COLUMN: 'text/kanban-column',
  CARD: 'text/kanban-card',
};

class KanbanBoard extends ProgressiveElement {
  static tagName = 'kanban-board' as const;

  static delegatedEvents = [
    'click',
    'change',
    'input',
    'dragstart',
    'dragend',
    'dragover',
    'dragleave',
    'drop',
    'keyup',
  ];

  #ul = this.querySelector('ul')!;

  #input = this.querySelector('h2 input') as HTMLInputElement;
  get name() {
    return this.#input.value;
  }
  set name(name) {
    this.#input.value = name;
  }

  #filterInput = this.querySelector('input[name="filter"]') as HTMLInputElement;
  get filter() {
    return this.#filterInput.value;
  }
  set filter(filter) {
    this.#filterInput.value = filter;
  }

  get cards(): KanbanCard[] {
    return Array.from(this.querySelectorAll('kanban-card'));
  }

  #excludedIntentions = new Set<string>();

  handleEvent(event: Event) {
    const { intention, target } = findClosestIntention(event, this.#excludedIntentions);
    if (intention === undefined) return;

    switch (intention) {
      case 'UPDATE_BOARD_NAME': {
        return;
      }
      case 'ADD_COLUMN': {
        this.addColumn({ id: crypto.randomUUID(), name: '', cards: [] });
        return;
      }
      case 'DELETE_COLUMN': {
        const column = target.closest(KanbanColumn.tagName)!;
        column.remove();
        return;
      }
      // TODO: some times the browser will save the value of the filter input but we dont apply it.
      case 'FILTER_CARDS': {
        const filter = this.filter.toLowerCase();
        this.cards.forEach((card) => {
          // Note: Filtering cards depends on the cards being hidden with the `hidden` attribute.
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
        const card = target.closest(KanbanCard.tagName)!;
        card.remove();
        return;
      }
      case 'START_DRAGGING_CARD': {
        if (!(event instanceof DragEvent)) return;

        (document.activeElement as HTMLElement)?.blur();
        const card = target.closest(KanbanCard.tagName)!;
        card.dragging = true;
        event.dataTransfer!.setData(CONTENT_TYPES.CARD, card.id);
        event.dataTransfer!.effectAllowed = 'move';
        return;
      }
      case 'STOP_DRAGGING_CARD': {
        const card = target.closest(KanbanCard.tagName)!;
        card.dragging = false;
        return;
      }
      case 'DRAGGING_OVER_CARD': {
        if (!(event instanceof DragEvent)) return;
        if (event.dataTransfer!.types.includes(CONTENT_TYPES.CARD)) {
          const card = target.closest(KanbanCard.tagName)!;
          event.preventDefault();
          event.stopPropagation();
          let rect = card.getBoundingClientRect();
          let midpoint = rect.top + rect.height / 2;
          card.acceptDrop = event.clientY <= midpoint ? 'accept-card-above' : 'accept-card-below';
        }
        return;
      }
      case 'DRAG_LEAVING_CARD': {
        if (!(event instanceof DragEvent)) return;
        if (event.dataTransfer!.types.includes(CONTENT_TYPES.CARD)) {
          const card = target.closest(KanbanCard.tagName)!;
          card.acceptDrop = 'none';
        }
        return;
      }
      case 'DROPPING_ON_CARD': {
        if (!(event instanceof DragEvent)) return;

        if (event.dataTransfer!.types.includes(CONTENT_TYPES.CARD)) {
          const card = target.closest(KanbanCard.tagName)!;
          const id = event.dataTransfer!.getData(CONTENT_TYPES.CARD);
          const droppedCard = this.getCard(id)!;
          card.insertAdjacentElement(card.acceptDrop === 'accept-card-above' ? 'beforebegin' : 'afterend', droppedCard);
          card.acceptDrop = 'none';
        }
        return;
      }
      case 'MOVE_CARD_UP': {
        if (!(target instanceof KanbanCard)) return;

        const sibling = closestSibling(target, ':not([hidden])', 'before');
        sibling?.insertAdjacentElement('beforebegin', target);
        target.focus();
        return;
      }
      case 'MOVE_CARD_TO_TOP': {
        if (!(target instanceof KanbanCard)) return;

        target.parentElement?.firstElementChild?.insertAdjacentElement('beforebegin', target);
        target.focus();
        return;
      }
      case 'MOVE_CARD_DOWN': {
        if (!(target instanceof KanbanCard)) return;

        closestSibling(target, ':not([hidden])', 'after')?.insertAdjacentElement('afterend', target);
        target.focus();
        return;
      }
      case 'MOVE_CARD_TO_BOTTOM': {
        if (!(target instanceof KanbanCard)) return;

        target.parentElement?.lastElementChild?.insertAdjacentElement('afterend', target);
        target.focus();
        return;
      }
      case 'MOVE_CARD_RIGHT': {
        if (!(target instanceof KanbanCard)) return;

        const column = target.closest('kanban-column');
        const columnToMoveTo = column?.nextElementSibling;

        if (columnToMoveTo instanceof KanbanColumn) {
          columnToMoveTo.appendCard(target);
          target.focus();
        }
        return;
      }
      case 'MOVE_CARD_LEFT': {
        if (!(target instanceof KanbanCard)) return;

        const column = target.closest('kanban-column');
        const columnToMoveTo = column?.previousElementSibling;

        if (columnToMoveTo instanceof KanbanColumn) {
          columnToMoveTo.appendCard(target);
          target.focus();
        }
        return;
      }
      case 'ADD_CARD': {
        const column = target.closest(KanbanColumn.tagName)!;
        column.addCard({ id: crypto.randomUUID(), name: '', description: '' });
        return;
      }
      case 'START_DRAGGING_COLUMN': {
        if (!(event instanceof DragEvent)) return;

        (document.activeElement as HTMLElement)?.blur();
        const column = target.closest(KanbanColumn.tagName)!;
        column.dragging = true;
        event.dataTransfer!.setData(CONTENT_TYPES.COLUMN, column.id);
        event.dataTransfer!.effectAllowed = 'move';
        this.#excludedIntentions.add('DRAGGING_OVER_CARD');
        this.#excludedIntentions.add('DRAG_LEAVING_CARD');
        this.#excludedIntentions.add('DROPPING_ON_CARD');
        return;
      }
      case 'STOP_DRAGGING_COLUMN': {
        const column = target.closest(KanbanColumn.tagName)!;
        column.dragging = false;
        this.#excludedIntentions.delete('DRAGGING_OVER_CARD');
        this.#excludedIntentions.delete('DRAG_LEAVING_CARD');
        this.#excludedIntentions.delete('DROPPING_ON_CARD');
        return;
      }
      case 'DRAGGING_OVER_COLUMN': {
        if (!(event instanceof DragEvent)) return;

        const column = target.closest(KanbanColumn.tagName)!;
        if (event.dataTransfer!.types.includes(CONTENT_TYPES.CARD)) {
          event.preventDefault();
          column.acceptDrop = 'accept-card';
        } else if (event.dataTransfer!.types.includes(CONTENT_TYPES.COLUMN)) {
          event.preventDefault();
          let rect = column.getBoundingClientRect();
          let midpoint = rect.left + rect.width / 2;
          column.acceptDrop = event.clientX <= midpoint ? 'accept-column-left' : 'accept-column-right';
        }
        return;
      }
      case 'DRAG_LEAVING_COLUMN': {
        if (!(event instanceof DragEvent)) return;

        const column = target.closest(KanbanColumn.tagName)!;
        if (event.dataTransfer!.types.includes(CONTENT_TYPES.CARD)) {
          column.acceptDrop = 'none';
        } else if (event.dataTransfer!.types.includes(CONTENT_TYPES.COLUMN)) {
          column.acceptDrop = 'none';
        }
        return;
      }
      case 'DROPPING_ON_COLUMN': {
        if (!(event instanceof DragEvent)) return;

        const column = target.closest(KanbanColumn.tagName)!;
        if (event.dataTransfer!.types.includes(CONTENT_TYPES.CARD)) {
          const id = event.dataTransfer!.getData(CONTENT_TYPES.CARD);
          const card = this.getCard(id)!;
          column.appendCard(card);
          column.acceptDrop = 'none';
        } else if (event.dataTransfer!.types.includes(CONTENT_TYPES.COLUMN)) {
          const id = event.dataTransfer!.getData(CONTENT_TYPES.COLUMN);
          const droppedColumn = this.getColumn(id)!;
          column.insertAdjacentElement(
            column.acceptDrop === 'accept-column-left' ? 'beforebegin' : 'afterend',
            droppedColumn
          );
          column.acceptDrop = 'none';
        }
        return;
      }
      case 'MOVE_COLUMN_RIGHT': {
        console.log(event);
        if (!(target instanceof KanbanColumn)) return;
        target.nextElementSibling?.insertAdjacentElement('afterend', target);
        target.focus();
        return;
      }
      case 'MOVE_COLUMN_LEFT': {
        if (!(target instanceof KanbanColumn)) return;
        target.previousElementSibling?.insertAdjacentElement('beforebegin', target);
        target.focus();
        return;
      }
    }
  }

  getCard(id: string): KanbanCard | null {
    return this.querySelector(`kanban-card[data-id="${id}"]`);
  }

  getColumn(id: string): KanbanColumn | null {
    return this.querySelector(`kanban-column[data-id="${id}"]`);
  }

  addColumn(column: Column) {
    const newColumn = parseHTML(renderColumn(column)) as KanbanColumn;
    this.#ul.appendChild(newColumn);
    newColumn.focusName();
  }

  focusName() {
    this.#input.focus();
  }

  toJSON(): Board {
    const columns = Array.from(this.querySelectorAll('kanban-column')).map((column) => column.toJSON());
    return { id: this.id, name: this.name, columns };
  }
}

class KanbanColumn extends ProgressiveElement {
  static tagName = 'kanban-column' as const;

  #internals = this.attachInternals();

  #ul = this.querySelector('ul')!;

  #input = this.querySelector('input')!;
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

  get cards(): KanbanCard[] {
    return Array.from(this.querySelectorAll('kanban-card'));
  }

  addCard(card: Card) {
    const newCard = parseHTML(renderCard(card)) as KanbanCard;
    this.appendCard(newCard);
    newCard.focusName();
  }

  appendCard(cardElement: KanbanCard) {
    this.#ul.appendChild(cardElement);
  }

  focusName() {
    this.#input.focus();
  }

  toJSON(): Column {
    const cards = this.cards.map((card) => card.toJSON());
    return { id: this.id, name: this.name, cards };
  }
}

class KanbanCard extends ProgressiveElement {
  static tagName = 'kanban-card' as const;

  #internals = this.attachInternals();

  #input = this.querySelector('input')!;
  get name() {
    return this.#input.value;
  }
  set name(name) {
    this.#input.value = name;
  }

  #textarea = this.querySelector('textarea')!;
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

  toJSON(): Card {
    return { id: this.id, name: this.name, description: this.description };
  }
}

KanbanBoard.register();
KanbanColumn.register();
KanbanCard.register();

declare global {
  interface HTMLElementTagNameMap {
    [KanbanBoard.tagName]: KanbanBoard;
    [KanbanColumn.tagName]: KanbanColumn;
    [KanbanCard.tagName]: KanbanCard;
  }
}
