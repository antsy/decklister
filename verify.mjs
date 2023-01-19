import { cards } from 'fab-cards';
import { DeckRow, textToPitchValue } from './decklist.mjs';

const verifyErrorText = '⚠️ Verification error:';

export function verify(decklist, options) {
  for (const card of decklist) {
    const nameMatches = cards.filter((dbc) => compareNames(dbc.name, card.name));
    if (nameMatches.length == 0) {
      errorHandler(`${verifyErrorText} There are no cards called '${card.name}'`, options);
    }
    const pitchableTypes = ['red', 'yellow', 'blue'];
    if (pitchableTypes.includes(card.type)) {
      if (!nameMatches.find((dbc) => dbc.pitch === textToPitchValue(card.type))) {
        errorHandler(`${verifyErrorText} There is no ${card.type} pitch for card '${card.name}'`, options);
      }
    }
  }
  // TODO: suggest closest card name in case of verification errors occur
  //       (closest-match library has levenshtein search to do just that)
  //       should there even be auto-correct cli option?
}

function compareNames(fromDb, fromInput) {
  const cleanedString = fromDb.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  return cleanedString == fromInput;
}

function errorHandler(errText, options) {
  if (options.halt) {
    throw new Error(errText);
  } else {
    console.error(errText);
  }
}
