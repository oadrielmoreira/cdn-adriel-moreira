/**
 * ───────────────────────────────────────────────────────────────
 *  IDENTIDADE VISUAL — FITZ DIGITAL
 * ───────────────────────────────────────────────────────────────
 *  Este é o ÚNICO lugar onde as cores da marca são definidas.
 *  Quando você me passar a paleta oficial da Fitz Digital,
 *  basta trocar os valores hex aqui embaixo e o site inteiro
 *  se ajusta automaticamente.
 *
 *  (Valores atuais = tema escuro moderno provisório roxo/violeta)
 * ───────────────────────────────────────────────────────────────
 */

export const theme = {
  // Cor principal da marca (botões, destaques, links)
  primary: "#7C3AED", // violeta
  primaryHover: "#6D28D9",
  primarySoft: "#7C3AED22", // versão translúcida p/ fundos

  // Cor de destaque / acento secundário
  accent: "#22D3EE", // ciano (usado nas barras de frequência)

  // Fundos
  bg: "#0B0B12", // fundo geral (quase preto)
  bgElevated: "#14141F", // cards / superfícies
  bgInput: "#1C1C2A", // campos de formulário

  // Bordas e divisórias
  border: "#2A2A3C",

  // Texto
  text: "#F5F5FA", // texto principal
  textMuted: "#9A9AB0", // texto secundário

  // Estados
  success: "#34D399",
  danger: "#F87171",

  // Tipografia da marca
  fontFamily:
    "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
} as const;

export type Theme = typeof theme;
