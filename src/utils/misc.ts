import DOMPurify from 'dompurify';
import QRCode from 'easyqrcodejs';

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
}

export const formatStampValue = (value: number, currency: string) => {
  const removeTrailingZeros = (value: string) => {
    return value.replace(/\.?0+$/, '');
  };

  // Return the amount with the correct number of decimal places
  return currency === 'BCH'
    ? removeTrailingZeros(value.toFixed(8))
    : value.toFixed(2);
}

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
    img.src = logo;

    return new Promise((resolve) => {
      // When the image has loaded, draw it on the canvas
      img.onload = function () {
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
      };

      // Otherwise, if it fails, just omit it.
      img.onerror = function () {
        resolve(canvas.toDataURL('image/png'));
      };
    });
  }

  return canvas.toDataURL('image/png');
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

    // debugger;

    if (split[0].toLowerCase() === 'qrcode') {
      // Prioritize data variables and, if none exist, just use the value provided.
      const urlArg = data[split[1]] || split[1];
      const logoArg = data[split[2]] || split[2];

      replacement = await renderQrCode(urlArg, logoArg);
    } else {
      replacement = data[split[0]] || split[0] || '';
    }

    // Replace the current match in the template
    compiledTemplate = compiledTemplate.replace(fullMatch, replacement);
  }

  // Sanitize the template using DOMPurify.
  const sanitizedTemplate = DOMPurify.sanitize(compiledTemplate, {
    USE_PROFILES: { html: true },
  });

  // Return the compiled template.
  return sanitizedTemplate;
};

export const printHtml = (html: string) => {
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    throw new Error('Failed to open print window');
  }

  printWindow.document.write('<html><head><title>Print Element</title>');
  printWindow.document.write('</head><body>');
  printWindow.document.write(
    '<style>html, body {margin: 0; padding: 0 } div  { box-sizing: border-box; } .page > * { break-inside: avoid }</style>'
  );
  /*printWindow.document.write(
    '<style>@page { size: A4; margin: 20mm; }</style>'
  );*/
  printWindow.document.write(
    '<div class="page" style="display:flex; flex-wrap: wrap; width: 100%; height: 100%;">'
  );
  printWindow.document.write(html);
  printWindow.document.write('</div>');
  printWindow.document.write('</body></html>');
  printWindow.document.close();

  printWindow.onload = function () {
    if (!printWindow) {
      throw new Error('Failed to open print window');
    }

    printWindow.focus();
    printWindow.print();
    setTimeout(() => {
      printWindow.close();
    }, 5000);
  };
};
