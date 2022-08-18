export default class CustomEvent extends Event {
  #detail;

  constructor(type, options) {
    super(type, options);
    this.#detail = options?.detail ?? null;
  }

  get detail() {
    return this.#detail;
  }
}
