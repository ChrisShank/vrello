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
