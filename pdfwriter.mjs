import { getPdfDocument, savePdfDocument } from './document.mjs';
import ptp from 'pdf-to-printer';
import {
  playerNameField,
  playerGemIdField,
  playerPronounField,
  heroNameField,
  dateField,
  eventNameField,
  equipmentFields,
  totalEquipmentCountField,
  redFields,
  totalRedCountField,
  yellowFields,
  totalYellowCountField,
  blueFields,
  totalBlueCountField,
} from './structure.mjs';

const excessErrorText = '💣 Form limits exceeded error:';

export async function saveToFile(decklist, options, variables) {
  const pdfDocument = await createPdf(decklist, options, variables);

  const filename = options.output ? options.output : 'decklist.pdf';

  console.log(`💾 Saving pdf as '${filename}'`);
  await savePdfDocument(filename, pdfDocument);

  if (options.print) {
    console.log(`🖨️ Printing pdf...'`);
    ptp
      .print(filename)
      .then(console.log(`File ${filename} was sent to printing.`))
      .catch((err) => errorHandler(err, options));
  }
}

async function createPdf(decklist, options, variables) {
  const pdfDocument = await getPdfDocument();
  const pdfForm = pdfDocument.getForm();

  pdfForm.getField(playerNameField).setText(variables.name);
  pdfForm.getField(playerGemIdField).setText(variables.gem_id);
  pdfForm.getField(playerPronounField).setText(variables.pronoun);
  pdfForm.getField(heroNameField).setText(variables.hero);
  pdfForm.getField(dateField).setText(variables.date);
  pdfForm.getField(eventNameField).setText(variables.event);

  let [equipmentIndex, redIndex, yellowIndex, blueIndex] = [0, 0, 0, 0]; // Indexes are position in form structure
  let [equipmentTotal, redTotal, yellowTotal, blueTotal] = [0, 0, 0, 0]; // Totals are total number of cards of type
  for (const card of decklist) {
    switch (card.type) {
      case 'equipment':
        equipmentTotal += card.amount;
        if (equipmentIndex >= equipmentFields.length) {
          errorHandler(
            `${excessErrorText} The amount of weapons and equipment cards exceeds the number ow rows in the sheet (${equipmentFields.length})`,
            options
          );
          continue;
        }
        pdfForm.getField(equipmentFields[equipmentIndex].text).setText(card.name);
        pdfForm.getField(equipmentFields[equipmentIndex].amount).setText(`${card.amount}`);

        equipmentIndex++;
        break;
      case 'red':
      case 'colorless': // Colorless cards go with reds in form
        redTotal += card.amount;
        if (redIndex >= redFields.length) {
          errorHandler(`${excessErrorText} The amount of red cards exceeds the number of rows in the sheet (${redFields.length})`, options);
          continue;
        }
        pdfForm.getField(redFields[redIndex].text).setText(card.name);
        pdfForm.getField(redFields[redIndex].amount).setText(`${card.amount}`);

        redIndex++;
        break;
      case 'yellow':
        yellowTotal += card.amount;
        if (yellowIndex >= yellowFields.length) {
          errorHandler(
            `${excessErrorText} The amount of yellow cards exceeds the number of rows in the sheet (${yellowFields.length})`,
            options
          );
          continue;
        }
        pdfForm.getField(yellowFields[yellowIndex].text).setText(card.name);
        pdfForm.getField(yellowFields[yellowIndex].amount).setText(`${card.amount}`);

        yellowIndex++;
        break;
      case 'blue':
        blueTotal += card.amount;
        if (blueIndex >= blueFields.length) {
          errorHandler(
            `${excessErrorText} The amount of blue cards exceeds the number of rows in the sheet (${blueFields.length})`,
            options
          );
          continue;
        }
        pdfForm.getField(blueFields[blueIndex].text).setText(card.name);
        pdfForm.getField(blueFields[blueIndex].amount).setText(`${card.amount}`);

        blueIndex++;
        break;
    }
  }

  pdfForm.getField(totalEquipmentCountField).setText(`${equipmentTotal}`);
  pdfForm.getField(totalRedCountField).setText(`${redTotal}`);
  pdfForm.getField(totalYellowCountField).setText(`${yellowTotal}`);
  pdfForm.getField(totalBlueCountField).setText(`${blueTotal}`);

  const total = equipmentTotal + redTotal + yellowTotal + blueTotal;
  console.log(`📃 Total amount of cards in the decklist (excluding any hero card): ${total}`);

  return pdfDocument;
}

function errorHandler(errText, options) {
  if (options.halt) {
    throw new Error(errText);
  } else {
    console.error(errText);
  }
}
