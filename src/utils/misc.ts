import QRCode from 'easyqrcodejs';
import { DateTime } from 'luxon';
import { watch } from 'vue';
import type { ComputedGetter, Ref, WatchStopHandle } from 'vue';

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

export const renderQrCode = async (
  content: string,
  logo?: string
): Promise<string> => {
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
    logo,
    correctLevel: QRCode.CorrectLevel.H,
  });

  // Get the canvas element so that we can draw a logo into it.
  // NOTE: We would use our QR Code library for this...
  //       But it is shit and doesn't work asynchronously.
  //       So we do it ourselves to avoid having to add shitty timers that trigger Jim's childhood PTSD.
  const canvas = virtualQRDiv.firstElementChild as HTMLCanvasElement;

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas 2D context');
  }

  const finalDiv = document.createElement('div');
  finalDiv.setAttribute('class', 'qr-code');
  finalDiv.setAttribute('style', 'position: relative;');
  const imgDiv = document.createElement('img');
  imgDiv.src = canvas.toDataURL('image/png');
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
  data: { [key: string]: string }
) => {
  // NOTE: We could use Handlebars JS here, but it doesn't support async helpers (needed for QR codes).
  //       So, instead, we're just going to write a simple template engine ourselves.

  // Define RegEx to capture all mustaches ({{ captureThis }}).
  const mustacheRegEx = /\{\{(.*?)\}\}/gs;

  // Create a copy of the template to work on
  let compiledTemplate = template;

  // Find all matches
  let match;
  const matches = [];

  // Collect all matches in the array
  while ((match = mustacheRegEx.exec(template)) !== null) {
    matches.push(match);
  }

  // Iterate over the matches array
  for (const match of matches) {
    const [fullMatch, p1] = match;
    const split = p1.trim().split(/\s+/); // Split by whitespace

    let replacement = '';

    // Handle the @qrcode directive.
    if (split[0].toLowerCase() === '@qrcode') {
      // Remove the @qrcode directive from the split array
      split.shift();

      if (split.length >= 2) {
        // The last element is always the LOGO_URL
        const logoArg =
          data[split[split.length - 1]] || split[split.length - 1];

        // Join the remaining elements to form the URL, replacing any data variables
        const urlParts = split.slice(0, -1).map((part) => data[part] || part);
        const urlArg = urlParts.join('');

        replacement = await renderQrCode(urlArg, logoArg);
      } else {
        // Handle the case where there aren't enough arguments
        console.error('Not enough arguments for @qrcode directive');
        replacement = 'ERROR: Invalid @qrcode usage';
      }
    }

    // Handle the @date directive
    else if (split[0].toLowerCase() === '@date') {
      const dateArg = data[split[1]] || split[1];
      const formatArg = data[split[2]] || split[2];

      const date = DateTime.fromFormat(dateArg, 'yyyy-MM-dd');

      replacement = date.toFormat(formatArg);
    }

    // Handle other literal insertions.
    else {
      replacement = data[split[0]] || split[0] || '';

      // if data[split[0]] is an empty string, use the data value. The above line would ignore an empty string as a value and break some stuff
      replacement = data[split[0]] === undefined ? replacement : data[split[0]];
    }

    // Replace the current match in the template
    compiledTemplate = compiledTemplate.replace(fullMatch, replacement);
  }

  // Return the compiled template.
  return compiledTemplate;
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
