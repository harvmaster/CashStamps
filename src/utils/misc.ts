import QRCode from 'easyqrcodejs';
import { DateTime } from 'luxon';
import { watch } from 'vue';
import type { ComputedGetter, Ref, WatchStopHandle } from 'vue';
import { sha256, utf8ToBin } from '@bitauth/libauth';
import { Dialog, QDialogOptions } from 'quasar';

// Convert a date to a string in the format of "YYYY/MM/DD"
export const dateToString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const formattedMonth = month < 10 ? `0${month}` : month;
  const formattedDay = day < 10 ? `0${day}` : day;

  return `${year}/${formattedMonth}/${formattedDay}`;
};

export const timeToString = (date = new Date()) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  const formattedHours = hours < 10 ? `0${hours}` : hours;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
};

// returns a string in the format of "dd MMM YYYY"
export const dateToStampString = (date = new Date()) => {
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};

export const formatStampValue = (value: number, currency: string) => {
  const removeTrailingZeros = (value: string) => {
    return value.replace(/\.?0+$/, '');
  };

  const formatFiat = (value: number) => {
    const val = value.toFixed(2);
    const parts = val.split('.');
    const integer = parts[0];
    const decimal = parts[1];

    if (decimal === '00') {
      return integer;
    }

    return val;
  };

  // Return the amount with the correct number of decimal places
  return currency === 'BCH'
    ? removeTrailingZeros(value.toFixed(8))
    : formatFiat(value);
};

const QR_CACHE_LIMIT = 100;
const qrCanvasCache = new Map<string, string>(); // content -> canvas dataURL

export const renderQrCode = async (
  content: string,
  logo?: string
): Promise<string> => {
  // Check the cache, bumping to most-recently-used on a hit.
  let canvasDataUrl = qrCanvasCache.get(content);
  if (canvasDataUrl) {
    qrCanvasCache.delete(content);
    qrCanvasCache.set(content, canvasDataUrl);
  }

  if (!canvasDataUrl) {
    // Create a virtual div to render the QR Code into.
    const virtualQRDiv = document.createElement('div');

    // Render the QR Code into the virtual div.
    new QRCode(virtualQRDiv, {
      text: content,
      width: 256,
      height: 256,
      quietZone: 5,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.L,
    });

    // Get the canvas element so that we can draw a logo into it.
    const canvas = virtualQRDiv.firstElementChild as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas 2D context');
    }

    canvasDataUrl = canvas.toDataURL('image/png');

    // Store in cache, evicting the least-recently-used entry if we're full.
    if (qrCanvasCache.size >= QR_CACHE_LIMIT) {
      const oldestKey = qrCanvasCache.keys().next().value;
      qrCanvasCache.delete(oldestKey);
    }
    qrCanvasCache.set(content, canvasDataUrl);
  }

  const finalDiv = document.createElement('div');
  finalDiv.setAttribute('class', 'qr-code');
  finalDiv.setAttribute('style', 'position: relative;');
  const imgDiv = document.createElement('img');
  imgDiv.src = canvasDataUrl;
  imgDiv.setAttribute('style', 'width: 100%; height: 100%;');
  if (logo) {
    const logoDiv = document.createElement('img');
    logoDiv.src = logo;
    logoDiv.setAttribute(
      'style',
      'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width:25%;'
    );
    finalDiv.appendChild(logoDiv);
  }

  finalDiv.appendChild(imgDiv);

  return finalDiv.outerHTML;
};

export const compileTemplate = async (
  template: string,
  data: Record<string, string>
) => {
  const mustacheRegEx = /\{\{(.*?)\}\}/gs;

  const evaluateExpression = (expr: string): string => {
    // 1. Check for ternary operator: condition ? trueVal : falseVal
    // Regex captures: [1] condition, [2] true branch, [3] false branch
    const ternaryMatch = expr.match(/^\s*(.*?)\s*\?\s*(.*?)\s*:\s*(.*?)\s*$/);

    if (ternaryMatch) {
      const [, conditionExpr, trueExpr, falseExpr] = ternaryMatch;

      // Evaluate the condition (is it non-empty / truthy in data?)
      const condVal = evaluateExpression(conditionExpr);

      // If condition resolved to a non-empty string, evaluate true branch, else false branch
      const chosenExpr = condVal.trim() !== '' ? trueExpr : falseExpr;

      return evaluateExpression(chosenExpr); // Recursively resolve selected branch
    }

    // 2. Standard fallback logic (|| operator)
    const candidates = expr.split('||').map((c) => c.trim());

    for (const candidate of candidates) {
      // Quoted string literal
      if (/^(['"]).*\1$/.test(candidate)) {
        return candidate.slice(1, -1);
      }

      // Check data key for non-empty string
      const val = data[candidate];
      if (val !== undefined && val !== null && val.trim() !== '') {
        return val;
      }

      // Fallback unquoted literal
      if (!(candidate in data)) {
        return candidate;
      }
    }

    return '';
  };

  // Splits directive content safely without breaking quoted strings or || expressions
  const parseArgs = (content: string): string[] => {
    // Matches quoted strings, || chains, OR ternary expressions as single token units
    const argRegEx =
      /(?:[^\s'"]+|'[^']*'|"[^"]*")+(?:\s*(?:\|\||\?|:)\s*(?:[^\s'"]+|'[^']*'|"[^"]*"))*/g;
    return content.match(argRegEx) || [];
  };

  let compiledTemplate = template;
  const matches = [...template.matchAll(mustacheRegEx)];

  for (const match of matches) {
    const [fullMatch, rawContent] = match;
    const rawTokens = parseArgs(rawContent.trim());

    if (rawTokens.length === 0) continue;

    const isDirective = rawTokens[0].startsWith('@');
    let replacement = '';

    if (isDirective) {
      const directive = rawTokens[0].toLowerCase();
      // Resolve all directive parameters through evaluateExpression
      const args = rawTokens.slice(1).map(evaluateExpression);

      switch (directive) {
        case '@qrcode': {
          if (args.length >= 2) {
            const logoArg = args[args.length - 1];
            const urlArg = args.slice(0, -1).join('');
            replacement = await renderQrCode(urlArg, logoArg);
          } else {
            console.error('Not enough arguments for @qrcode directive');
            replacement = 'ERROR: Invalid @qrcode usage';
          }
          break;
        }
        case '@date': {
          const [dateStr, formatStr] = args;
          const date = DateTime.fromFormat(dateStr, 'yyyy-MM-dd');
          replacement = date.toFormat(formatStr);
          break;
        }
        case '@number': {
          const [numStr, digitsStr] = args;
          replacement = String(numStr).padStart(parseInt(digitsStr, 10), '0');
          break;
        }
        default:
          console.error(`Unknown directive: ${directive}`);
          replacement = '';
      }
    } else {
      // Standard variable or fallback evaluation
      replacement = evaluateExpression(rawTokens.join(' '));
    }

    // Safely replace current match using callback to avoid regex special char issues ($1, $&, etc.)
    compiledTemplate = compiledTemplate.replace(fullMatch, () => replacement);
  }

  return compiledTemplate;
};

export const generateBatchID = function (mnemonic: string) {
  // Hash the mnemonic.
  const mnemonicHash = sha256.hash(utf8ToBin(mnemonic));

  // Take first 4 bytes and convert to numbers for better distribution
  const byte1 = mnemonicHash[0];
  const byte2 = mnemonicHash[1];

  const firstLetter = String.fromCharCode(65 + (byte1 % 26));
  const secondLetter = String.fromCharCode(65 + (byte2 % 26));

  return `${firstLetter}${secondLetter}`;
};

/**
 * Waits for the given reactive property to equal the given value.
 *
 * @remarks This works by creating a Vue Watcher on the property.
 *
 * @param property   The Reactive Property to watch.
 * @param toEqual    The value we are waiting for the reactive property to equal.
 */
export const waitFor = async function <T>(
  property: Ref<T> | ComputedGetter<T>,
  toEqual: T
): Promise<void> {
  // Declare a handle for our stopWatching function here so that it is in-scope.
  let stopWatching: WatchStopHandle | undefined;

  // Create a promise that waits for the reactive property to equal the given value.
  const waitForPromise = new Promise((resolve): void => {
    // Create a watcher on the reactive property and give it a handle so we can unwatch it later.
    // NOTE: We use `immediate: true` to eagerly evaluate when `watch` is first called.
    stopWatching = watch(
      property,
      (newValue) => {
        // If the value of the property equals the value we want it to equal, resolve our promise.
        if (newValue === toEqual) {
          resolve(true);
        }
      },
      { immediate: true }
    );
  });

  // Wait for our promise to resolve.
  await waitForPromise;

  // Stop watching this value.
  // NOTE: This cannot be called inside our watcher as the stopWatching handle won't be instantiated yet.
  if (stopWatching) {
    stopWatching();
  }
};

export function confirm(options: QDialogOptions): Promise<boolean> {
  return new Promise((resolve) => {
    Dialog.create({
      cancel: true,
      persistent: true,
      ...options,
    })
      .onOk(() => resolve(true))
      .onCancel(() => resolve(false))
      .onDismiss(() => resolve(false)); // belt and suspenders
  });
}

export async function pickFile(options?: {
  accept?: string;
  binary?: boolean;
}): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    if (options?.accept) input.accept = options.accept;

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(reader.error);
      options?.binary ? reader.readAsDataURL(file) : reader.readAsText(file);
    };

    input.oncancel = () => resolve(null);

    input.click();
  });
}
