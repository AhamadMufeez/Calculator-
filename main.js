/* ─── BUG FIX: declare all variables with const/let (no implicit globals) ─── */
const resultScreen  = document.getElementById('resultScreen');
const historyScreen = document.getElementById('historyScreen');
const offlineBadge  = document.getElementById('offlineBadge');

/* BUG FIX: declared with const (was implicit global) */
const OPERATORS = ['+', '-', '*', '/'];

let result = '';       // raw expression string
let justEvaled = false; // track whether last action was "="

/* ─────────────────────────────────────────────
   Display
───────────────────────────────────────────── */
function updateDisplay(history = '') {
  // Show placeholder "0" when empty
  resultScreen.textContent  = result === '' ? '0' : formatDisplay(result);
  historyScreen.textContent = history;
}

/** Replace raw operators with nicer glyphs for display only */
function formatDisplay(expr) {
  return expr
    .replace(/\*/g, '×')
    .replace(/\//g, '÷')
    .replace(/-/g, '−');
}

/* ─────────────────────────────────────────────
   Core input logic
───────────────────────────────────────────── */
function handleInput(button) {
  const id    = button.id;
  const value = button.value;

  /* ── EQUALS ── */
  if (id === 'equalbtn') {
    if (result === '') return;

    /* BUG FIX: wrap eval in try/catch so invalid expressions don't crash */
    try {
      const expression = result;                // save for history
      const evaluated  = Function('"use strict"; return (' + result + ')')();

      /* Guard against Infinity / NaN */
      if (!isFinite(evaluated)) {
        showError('Math error');
        return;
      }

      /* Trim floating-point noise (0.1 + 0.2 → 0.3, not 0.30000000000000004) */
      const clean = parseFloat(evaluated.toPrecision(12)).toString();

      historyScreen.textContent = formatDisplay(expression) + ' =';
      result    = clean;
      justEvaled = true;
      updateDisplay();
    } catch {
      showError('Syntax error');
    }
    return;
  }

  /* ── CLEAR ALL ── */
  if (id === 'clearbtn') {
    result     = '';
    justEvaled = false;
    historyScreen.textContent = '';
    updateDisplay();
    return;
  }

  /* ── BACKSPACE ── */
  if (id === 'cancelbtn') {
    result = result.slice(0, -1);
    justEvaled = false;
    updateDisplay();
    return;
  }

  /* ── Everything else: digit / operator / bracket / decimal ── */

  /* If user types a digit/bracket right after "=", start fresh */
  if (justEvaled && !OPERATORS.includes(value)) {
    result = '';
  }
  /* If user types an operator right after "=", continue with result */
  justEvaled = false;

  /* Decimal point guard */
  if (value === '.') {
    if (hasDecimalInCurrentOperand(result)) return;
    /* Prepend "0" if decimal starts a number */
    if (result === '' || OPERATORS.includes(result[result.length - 1]) || result[result.length - 1] === '(') {
      result += '0';
    }
    result += '.';
    updateDisplay();
    return;
  }

  /* Operator guard: BUG FIX — replace the last operator char directly
     instead of using .replace() which only finds the first occurrence */
  if (OPERATORS.includes(value)) {
    if (result === '' || result === '-') return;      // nothing to operate on
    const last = result[result.length - 1];
    if (OPERATORS.includes(last)) {
      result = result.slice(0, -1) + value;           // swap last operator
    } else if (last !== '(') {
      result += value;
    }
    updateDisplay();
    return;
  }

  /* Default: append the character */
  result += value;
  updateDisplay();
}

function showError(msg) {
  historyScreen.textContent = result ? formatDisplay(result) : '';
  result = '';
  resultScreen.textContent = msg;
  resultScreen.classList.add('error');
  setTimeout(() => {
    resultScreen.classList.remove('error');
    updateDisplay();
  }, 1200);
}

/* ─────────────────────────────────────────────
   Decimal helper
   BUG FIX: original had a conceptual gap with brackets — this version
   correctly searches only within the current operand after the last
   operator OR open-bracket, whichever comes last.
───────────────────────────────────────────── */
function hasDecimalInCurrentOperand(str) {
  let lastSplit = -1;
  for (let i = str.length - 1; i >= 0; i--) {
    if (OPERATORS.includes(str[i]) || str[i] === '(') {
      lastSplit = i;
      break;
    }
  }
  const operand = lastSplit === -1 ? str : str.substring(lastSplit + 1);
  return operand.includes('.');
}

/* ─────────────────────────────────────────────
   Wire up all buttons
───────────────────────────────────────────── */
const buttonIds = [
  'onebtn','twobtn','threebtn','fourbtn','fivebtn','sixbtn',
  'sevenbtn','eightbtn','ninebtn','zerobtn',
  'plusbtn','minusbtn','multiplybtn','dividebtn',
  'openbracket','closebracket','pointbtn',
  'equalbtn','cancelbtn','clearbtn'
];

buttonIds.forEach(id => {
  const btn = document.getElementById(id);
  if (!btn) return;

  /* Visual ripple feedback */
  btn.addEventListener('click', (e) => {
    btn.classList.add('pressed');
    setTimeout(() => btn.classList.remove('pressed'), 120);
    handleInput(btn);
  });
});

/* ─────────────────────────────────────────────
   Keyboard support (enhancement)
───────────────────────────────────────────── */
const keyMap = {
  '0':'zerobtn','1':'onebtn','2':'twobtn','3':'threebtn','4':'fourbtn',
  '5':'fivebtn','6':'sixbtn','7':'sevenbtn','8':'eightbtn','9':'ninebtn',
  '+':'plusbtn','-':'minusbtn','*':'multiplybtn','/':'dividebtn',
  '.':'pointbtn','=':'equalbtn','Enter':'equalbtn',
  'Backspace':'cancelbtn','Escape':'clearbtn',
  '(':'openbracket',')':'closebracket'
};

document.addEventListener('keydown', (e) => {
  const id = keyMap[e.key];
  if (!id) return;
  e.preventDefault();
  const btn = document.getElementById(id);
  if (btn) {
    btn.classList.add('pressed');
    setTimeout(() => btn.classList.remove('pressed'), 120);
    handleInput(btn);
  }
});

/* ─────────────────────────────────────────────
   Offline status badge
───────────────────────────────────────────── */
function updateOnlineStatus() {
  if (!navigator.onLine) {
    offlineBadge.textContent = '● offline';
    offlineBadge.classList.add('visible');
  } else {
    offlineBadge.textContent = '';
    offlineBadge.classList.remove('visible');
  }
}
window.addEventListener('online',  updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

/* ─────────────────────────────────────────────
   Service Worker registration
───────────────────────────────────────────── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./service-worker.js')
      .then(reg => console.log('[SW] Registered, scope:', reg.scope))
      .catch(err => console.warn('[SW] Registration failed:', err));
  });
}

/* Initial render */
updateDisplay();
