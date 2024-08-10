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
  const virtualDiv = document.createElement('div');

  // Render the QR Code into the virtual div.
  new QRCode(virtualDiv, {
    text: content,
    width: 256,
    height: 256,
    quietZone: 5,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H,
  });

  // Get the canvas element so that we can draw a logo into it.
  // NOTE: We would use our QR Code library for this...
  //       But it is shit and doesn't work asynchronously.
  //       So we do it ourselves to avoid having to add shitty timers that trigger Jim's childhood PTSD.
  const canvas = virtualDiv.firstElementChild as HTMLCanvasElement;

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas 2D context');
  }

  if (logo) {
    // Create a new image object
    const img = new Image();

    // Set the source of the image (replace with your image path)
    if (process.env.BASE_PATH) {
      img.src = `/${process.env.BASE_PATH}/${logo}`;
    } else {
      img.src = logo;
    }

    return new Promise((resolve) => {
      // When the image has loaded, draw it on the canvas
      img.onload = function () {
        try {
          // Calculate the center position to place the image
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;

          // Resize the image to fit within the canvas dimensions
          const scaleFactor =
            Math.min(canvas.width / img.width, canvas.height / img.height) / 4;
          const scaledWidth = img.width * scaleFactor;
          const scaledHeight = img.height * scaleFactor;

          // Calculate the position to draw the image to be centered
          const drawX = centerX - scaledWidth / 2;
          const drawY = centerY - scaledHeight / 2;

          // Draw the image on the canvas
          ctx.drawImage(img, drawX, drawY, scaledWidth, scaledHeight);

          resolve(canvas.toDataURL('image/png'));
        } catch (error) {
          console.warn(error);
          resolve(canvas.toDataURL('image/png'));
        }
      };

      // Otherwise, if it fails, just omit it.
      img.onerror = function () {
        resolve(canvas.toDataURL('image/png'));
      };
    });
  }

  return canvas.toDataURL('image/png');
};

export const parseMustache = (mustacheContent: string) => {
  // We split the placeholder and the default value of the placeholder.
  // NOTE: Example: {{ @qrcode someLink|https://stamps.cash icon|https://stamps.cash/bch.png }}
  const tokens = mustacheContent
    .trim()
    .split(' ')
    .map((content) => content.trim());

  const parsedTokens = tokens.map((arg) => {
    // If this is a directive (begins with '@' character)
    if (arg.startsWith('@')) {
      return {
        type: 'directive',
        value: arg,
      };
    } else {
      const [value, defaultValue] = arg.split('|');

      return {
        type: 'variable',
        value,
        defaultValue,
      };
    }
  });

  return parsedTokens;
};

export const compileTemplate = async (
  template: string,
  data: { [key: string]: string }
) => {
  // NOTE: We could use Handlebars JS here, but it doesn't support async helpers (needed for QR codes).
  //       So, instead, we're just going to write a simple template engine ourselves.

  // Define RegEx to capture all mustaches ({{ captureThis }}).
  const mustacheRegEx = /\{\{(.*?)\}\}/g;

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

    if (split[0].toLowerCase() === 'qrcode') {
      // Prioritize data variables and, if none exist, just use the value provided.
      const urlArg = data[split[1]] || split[1];
      const logoArg = data[split[2]] || split[2];

      replacement = await renderQrCode(urlArg, logoArg);
    } else {
      replacement = data[split[0]] || split[0] || '';

      // if data[split[0]] is an empty string, use the data value. The above line would ignore an empty string as a value and break some stuff
      replacement = data[split[0]] === undefined ? replacement : data[split[0]];
    }

    if (split[0].toLowerCase() === 'date') {
      const dateArg = data[split[1]] || split[1];
      const formatArg = data[split[2]] || split[2];

      const date = DateTime.fromFormat(dateArg, 'yyyy-MM-dd');

      replacement = date.toFormat(formatArg);
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
