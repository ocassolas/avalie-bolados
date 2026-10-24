/** Aplica um tema na hora (sem esperar o servidor). */
export function applyTheme(value: string) {
  document.documentElement.dataset.theme = value;
}
