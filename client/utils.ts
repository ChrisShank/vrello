export interface Intention {
  intention: string;
  target: Element;
}

/**
 * Given a DOM event this utility function finds the closest intention. An intention is a DOM attribute that maps a DOM event to a semantically meaningful event. The attribute takes the shape `${prefix}${event.type}${modifiers?}="${semantic event}"`.
 * @param event DOM event
 * @param modifier A function that adds a modifier to the intention. Useful for keyboard modifiers.
 * @param prefix By default intentions are prefixed with `on:`, use this to override that prefix.
 * @returns
 */
export function findClosestIntention(event: Event): Intention | Record<string, never> {
  if (event.target instanceof Element) {
    const attributeName = `on-${event.type}`;
    const target = event.target.closest(`[${attributeName}]`);
    if (target !== null) {
      const intention = target.getAttribute(attributeName)!;
      return { intention, target };
    }
  }

  return {};
}

export interface AnyEvent {
  type: string;
  [key: string]: any;
}

// Any string is valid, but we can provide auto-complete for built-in event.
type AnyEventType = keyof HTMLElementEventMap | (string & {});

export class ProgressiveElement extends HTMLElement {
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
  static delegatedEvents: AnyEventType[];

  constructor() {
    super();

    const constructor = this.constructor as typeof ProgressiveElement;
    constructor.delegatedEvents?.forEach((event) => this.addEventListener(event, this));
  }

  /**
   * This method is called any time an event is delegated. It's a central handler to handle events for this custom element. No need to call `super.handleEvent()`.
   * @param event
   */
  // @ts-ignore unused parameter
  handleEvent(event: Event) {}
}

export function parseHTML(html: string): Element {
  return document.createRange().createContextualFragment(html).firstElementChild!;
}
