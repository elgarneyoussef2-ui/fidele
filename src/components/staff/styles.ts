export const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: #F5F3FF; -webkit-font-smoothing: antialiased; }
  body { font-family: var(--font-sans), system-ui, sans-serif; color: #15101F; }
  button { font-family: inherit; cursor: pointer; border: none; background: none; -webkit-tap-highlight-color: transparent; }
  button:active { opacity: .75; transform: scale(.97); }
  input  { font-family: inherit; }
  button:focus-visible, a:focus-visible, input:focus-visible { outline: 2px solid #5B21B6; outline-offset: 2px; }
  @keyframes spin    { to { transform: rotate(360deg) } }
  @keyframes fadein  { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes popIn   { from { opacity: 0; transform: scale(.85) } to { opacity: 1; transform: scale(1) } }
  @keyframes badgePop { 0%{transform:scale(1)} 40%{transform:scale(1.5)} 100%{transform:scale(1)} }
  .fadein  { animation: fadein  .25s ease both; }
  .popin   { animation: popIn   .3s cubic-bezier(.34,1.56,.64,1) both; }
  .badgepop { animation: badgePop .4s cubic-bezier(.34,1.56,.64,1); }
  @keyframes pulse-ring { 0%,100%{transform:scale(0.92);opacity:.6} 50%{transform:scale(1.08);opacity:1} }
  @keyframes dot-pop    { 0%,100%{transform:scale(1)} 50%{transform:scale(1.3)} }
  .sp-ring { animation:pulse-ring 1.6s ease-in-out infinite; transform-origin:50px 50px }
  .sp-dot  { animation:dot-pop   1.6s ease-in-out infinite; transform-origin:50px 50px }
`
