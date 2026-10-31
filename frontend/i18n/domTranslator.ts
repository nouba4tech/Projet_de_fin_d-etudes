// Shows the interface in English without touching the screens' code: the French texts written by React are
// replaced in the page (text, placeholder, title...) using the dictionary of i18n/en.json.
// Typed values (inputs, textareas) are never changed, and an element marked data-no-translate is left alone.

export interface Dictionary {
  /** exact French text -> English */
  texts: Record<string, string>;
  /** French text with {0}, {1}... for the variable parts -> English with the same markers */
  patterns: Record<string, string>;
}

const ATTRIBUTES = ['placeholder', 'title', 'aria-label', 'alt'];
const SKIPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE', 'NOSCRIPT']);

const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();
const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class DomTranslator {
  private readonly texts = new Map<string, string>();
  private readonly patterns: { regex: RegExp; english: string; openEnd: boolean }[] = [];
  private readonly cache = new Map<string, string | null>();
  /** what was written last in each text node / attribute, to tell our writes from React's */
  private readonly written = new WeakMap<Node, string>();
  private readonly writtenAttributes = new WeakMap<Element, Record<string, string>>();
  private observer: MutationObserver | null = null;
  private nativeDialogs: { alert: typeof window.alert; confirm: typeof window.confirm; prompt: typeof window.prompt } | null = null;

  constructor(dictionary: Dictionary) {
    for (const [french, english] of Object.entries(dictionary.texts)) {
      this.texts.set(normalize(french), english);
    }
    for (const [french, english] of Object.entries(dictionary.patterns)) {
      const source = normalize(french).split(/(\{\d+\})/).map(part =>
        /^\{\d+\}$/.test(part) ? '(.*?)' : escapeRegExp(part)).join('');
      this.patterns.push({ regex: new RegExp(`^${source}$`, 's'), english, openEnd: /\{\d+\}$/.test(normalize(french)) });
    }
    // the longest patterns first: "Supprimer le client {0} ?" before "Supprimer {0}"
    this.patterns.sort((a, b) => b.regex.source.length - a.regex.source.length);
  }

  /** English version of a French text, or null when nothing is known for it. */
  translate(text: string): string | null {
    const key = normalize(text);
    if (!key || !/[A-Za-zÀ-ÿ]/.test(key)) return null;
    if (this.cache.has(key)) return this.cache.get(key)!;
    const result = this.lookup(key, 0);
    if (this.cache.size > 20000) this.cache.clear();
    this.cache.set(key, result);
    return result;
  }

  private lookup(key: string, depth: number): string | null {
    const exact = this.texts.get(key);
    if (exact !== undefined) return exact;

    // same text with different trailing punctuation ("Montant :", "Chargement...")
    const tail = key.match(/^(.*?)(\s*[:.!?*…]+)$/);
    if (tail && this.texts.has(tail[1])) return this.texts.get(tail[1])! + tail[2].replace(/^\s+(?=:)/, '');

    for (const { regex, english, openEnd } of this.patterns) {
      const match = key.match(regex);
      // "Chambre {0}" is for "Chambre 101", not for a sentence typed by a user ("Chambre 103 non prete")
      if (match && !(openEnd && /\s/.test(match[match.length - 1]))) {
        return english.replace(/\{(\d+)\}/g, (_, i) => {
          const part = match[Number(i) + 1] ?? '';
          return (depth < 2 && this.lookup(part.trim(), depth + 1)) || part;
        });
      }
    }

    // "Erreur : message", "Statut - En attente": translate each side of the separator
    if (depth < 2) {
      const split = key.match(/^(.+?)(\s*[:\-–·|]\s+)(.+)$/);
      if (split) {
        const left = this.lookup(split[1], depth + 1);
        const right = this.lookup(split[3], depth + 1);
        if (left || right) return (left ?? split[1]) + split[2] + (right ?? split[3]);
      }
    }
    return null;
  }

  start(root: Node = document.body) {
    this.translateTree(root);
    this.translateTitle();
    this.observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          this.translateTextNode(mutation.target as Text);
        } else if (mutation.type === 'attributes') {
          this.translateAttribute(mutation.target as Element, mutation.attributeName!);
        } else {
          mutation.addedNodes.forEach(node => this.translateTree(node));
          if (mutation.target === document.head || mutation.target.parentNode === document.head) this.translateTitle();
        }
      }
    });
    this.observer.observe(document.documentElement, {
      subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRIBUTES,
    });
    this.patchDialogs();
  }

  stop() {
    this.observer?.disconnect();
    this.observer = null;
    if (this.nativeDialogs) {
      Object.assign(window, this.nativeDialogs);
      this.nativeDialogs = null;
    }
  }

  /** {@code inside} is true once an ancestor of the node was checked: only the top of a subtree climbs the DOM. */
  private translateTree(node: Node, inside = false) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (inside) this.translateText(node as Text);
      else this.translateTextNode(node as Text);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const element = node as Element;
    if (element.hasAttribute('data-no-translate') || (!inside && this.isSkipped(element.parentElement))) return;
    for (const name of ATTRIBUTES) {
      if (element.hasAttribute(name)) this.translateAttribute(element, name, true);
    }
    if (element instanceof HTMLInputElement && (element.type === 'button' || element.type === 'submit')) {
      this.translateAttribute(element, 'value', true);
    }
    if (element instanceof HTMLOptionElement && !element.hasAttribute('value')) {
      // the option's value defaults to its text: keep the French one for the screen's logic
      element.setAttribute('value', element.text);
    }
    // a textarea's placeholder is translated above, never what is typed in it
    if (SKIPPED_TAGS.has(element.tagName) || (element as HTMLElement).isContentEditable) return;
    element.childNodes.forEach(child => this.translateTree(child, true));
  }

  private isSkipped(element: Element | null): boolean {
    for (let current = element; current; current = current.parentElement) {
      if (SKIPPED_TAGS.has(current.tagName) || current.hasAttribute('data-no-translate')
          || (current as HTMLElement).isContentEditable) {
        return true;
      }
    }
    return false;
  }

  private translateTextNode(node: Text) {
    if (this.written.get(node) === node.nodeValue || !node.parentElement || this.isSkipped(node.parentElement)) return;
    this.translateText(node);
  }

  private translateText(node: Text) {
    const value = node.nodeValue ?? '';
    if (this.written.get(node) === value) return;
    const english = this.translate(value);
    if (english === null) return;
    // keep the spaces around the text: JSX relies on them between words and values
    const lead = value.match(/^\s*/)![0];
    const trail = value.match(/\s*$/)![0];
    const result = lead + english + trail;
    this.written.set(node, result);
    if (result !== value) node.nodeValue = result;
  }

  private translateAttribute(element: Element, name: string, checked = false) {
    const value = element.getAttribute(name);
    if (!value) return;
    const done = this.writtenAttributes.get(element) ?? {};
    // a textarea's own placeholder is translated, only its content is left alone
    if (done[name] === value || element.hasAttribute('data-no-translate')
        || (!checked && this.isSkipped(element.parentElement))) return;
    const english = this.translate(value);
    if (english === null) return;
    done[name] = english;
    this.writtenAttributes.set(element, done);
    if (english !== value) element.setAttribute(name, english);
  }

  private translateTitle() {
    const english = this.translate(document.title);
    if (english && english !== document.title) document.title = english;
  }

  private patchDialogs() {
    if (this.nativeDialogs) return;
    const native = { alert: window.alert, confirm: window.confirm, prompt: window.prompt };
    this.nativeDialogs = native;
    const tr = (message?: unknown) => (typeof message === 'string' ? this.translate(message) ?? message : message);
    window.alert = (message?: unknown) => native.alert.call(window, tr(message));
    window.confirm = (message?: string) => native.confirm.call(window, tr(message) as string);
    window.prompt = (message?: string, defaultValue?: string) => native.prompt.call(window, tr(message) as string, defaultValue);
  }
}
