/**
 * ───────────────────────────────────────────────────────────────
 *  IDENTIDADE VISUAL — CDN ADRIEL
 *  Tema escuro verde.
 *  Para mudar a paleta, altere os valores hex aqui.
 *  O site inteiro se ajusta automaticamente.
 * ───────────────────────────────────────────────────────────────
 */

export const theme = {
  // Cor principal da marca (botões, destaques, links)
  primary: "#22C55E",       // verde vibrante
  primaryHover: "#16A34A",  // verde mais escuro (hover)
  primarySoft: "#22C55E1A", // versão translúcida p/ fundos e badges

  // Acento secundário (barras do visualizador de frequência)
  accent: "#86EFAC", // verde claro

  // Fundos
  bg: "#070D08",          // fundo geral (preto com tom verde)
  bgElevated: "#0D1A0F",  // cards / superfícies
  bgInput: "#132016",     // campos de formulário

  // Bordas e divisórias
  border: "#1E3322",

  // Texto
  text: "#F0FFF4",      // branco com leve toque verde (mint white)
  textMuted: "#7DA685", // verde acinzentado para texto secundário

  // Estados
  success: "#4ADE80", // verde brilhante (confirmações)
  danger: "#F87171",  // vermelho (erros)

  // Tipografia
  fontFamily:
    "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
} as const;

export type Theme = typeof theme;
