export interface Intention {
  intention: string;
  target: Element;
}

export function findClosestIntention(
  event: Event,
  excludedIntentions?: ReadonlySet<string>
): Intention | { intention?: never; target?: never } {
  let target: Element | null = event.target as Element | null;

  while (target !== null) {
    const attributeName = `on-${event.type}${mouseModifiers(event)}${keyboardModifiers(event)}`;
    const intentionTarget = target.closest(`[${CSS.escape(attributeName)}]`);
    if (intentionTarget !== null) {
      const intention = intentionTarget.getAttribute(attributeName)!;
      if (excludedIntentions === undefined || !excludedIntentions.has(intention)) {
        return { intention, target: intentionTarget };
      }
    }
    target = intentionTarget?.parentElement || null;
  }

  return {};
}

const systemKeys = ['alt', 'ctrl', 'meta', 'shift'];

function keyboardModifiers(event: Event) {
  if (event instanceof KeyboardEvent) {
    const systemModifiers = systemKeys.filter((key) => event[`${key}Key` as keyof KeyboardEvent]).join('.');
    return `${systemModifiers.length > 0 ? '.' : ''}${systemModifiers}.${event.code}`;
  }
  return '';
}

function mouseModifiers(event: Event) {
  if (event instanceof MouseEvent && event.button > 0) {
    return `.${event.button === 1 ? 'middle' : 'right'}`;
  }
  return '';
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

export function closestSibling(el: Element, selector: string, where: 'before' | 'after'): Element | null {
  const siblingProperty = where === 'before' ? 'previousElementSibling' : 'nextElementSibling';
  let sibling = el[siblingProperty];
  while (sibling !== null && !sibling.matches(selector)) {
    sibling = sibling[siblingProperty];
  }
  return sibling;
}
