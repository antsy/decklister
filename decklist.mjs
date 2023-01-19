import clipboard from 'clipboardy';
import { closestMatch } from 'closest-match';
import { cards } from 'fab-cards';
import { default as fileSystem } from 'fs';

/*

Hi! this file contains all the decklist parsing logic.

Card types (which are currently allowed in the official deck sheet):

'colorless': No pitch value
'red': Pitch value 1 (red)
'yellow': Pitch value 2 (yellow)
'blue': Pitch value 3 (blue)
'equipment': weapon/equipment card
'hero': hero card

*/

export class DeckRow {
  constructor(cardname, cardtype, cardamount) {
    this.name = cardname;
    this.type = cardtype;
    this.amount = cardamount;
  }
}

export function readFromClipboard() {
  const clipboardText = clipboard.readSync();

  const decklistFormat = detectFormat(clipboardText);
  console.debug(`Assuming the decklist is in ${decklistFormat} format`);

  return convertTextToDeck(clipboardText, decklistFormat);
}

export function readFromFile(filename) {
  if (!fileSystem.existsSync(filename)) {
    throw new Error(`File not found: ${filename}`);
  }

  const decklistText = fileSystem.readFileSync(filename, 'utf8');
  const decklistFormat = detectFormat(decklistText);
  console.debug(`Assuming the decklist is in ${decklistFormat} format`);

  return convertTextToDeck(decklistText, decklistFormat);
}

export function detectFormat(decklist) {
  const fabdbMatches = decklist.match(/Deck build|https\:\/\/fabdb.net|Weapons.*|Equipment.*|\[\d\]\s.*\s\(Red|Yellow|Blue\)\n/gm);
  const fabraryMatches = decklist.match(
    /Deck built with |FaBrary|Class.*|Hero.*|Weapons.*|Equipment.*|\(\d\)\s(.*)\s\(red|yellow|blue\)|See the full deck|fabrary.net/gm
  );
  const fabtcgMatches = decklist.match(/Hero\s\/\sWeapon\s\/\sEquipment|Pitch\s\d|Others|\d\sx\s(.*)|d\sx\s(.*)\(\d\)/gm);
  const oldschoolDeckistMatches = decklist.match(/^(?:\d)x?\s(?:.+?)(?:\s(\(|\[)(?:r|y|b|red|yellow|blue|\d)(\)|\]))?$/gim);

  const matches = [
    Number(fabdbMatches?.length | 0),
    Number(fabraryMatches?.length | 0),
    Number(fabtcgMatches?.length | 0),
    Number(oldschoolDeckistMatches?.length | 0),
  ];
  const i = matches.indexOf(Math.max(...matches));

  switch (i) {
    case 0:
      return 'fabdb';
    case 1:
      return 'fabrary';
    case 2:
      return 'fabtcg';
    case 3:
      return 'oldschool';
  }

  return 'unknown';
}

export function convertTextToDeck(decklistAsText, format) {
  switch (format) {
    case 'fabdb': {
      return fabdbToDeck(decklistAsText);
    }
    case 'fabrary': {
      return fabraryToDeck(decklistAsText);
    }
    case 'fabtcg': {
      return fabtcgToDeck(decklistAsText);
    }
    case 'oldschool': {
      return oldschoolFormatToDeck(decklistAsText);
    }
    case 'random': {
      return randomFormatToDeck(decklistAsText);
    }
    default:
      return [];
  }
}

function fabdbToDeck(decklistAsText) {
  const rows = stringToArray(decklistAsText);
  let section = 0;
  const deck = [];

  for (const row of rows) {
    if (/(.*)\s\((?<hero>.*)\)/.test(row) && section == 0) {
      const matches = row.match(/(.*)\s\((?<hero>.*)\)/);
      deck.push(new DeckRow(matches.groups.hero, 'hero', 1));
      section = 1;
    }
    if (/^Weapons:\s(?<weapons>.*,?)/.test(row)) {
      const matches = row.match(/^Weapons:\s(?<weapons>.*,?)/);
      let weapons = matches.groups.weapons.split(',').map((w) => w.trim());
      weapons = weapons.reduce((all, item) => {
        all[item] ? all[item]++ : (all[item] = 1);
        return all;
      }, {});
      for (var w in weapons) {
        deck.push(new DeckRow(w, 'equipment', weapons[w]));
      }
      section = 2;
    }
    if (/^Equipment:\s(?<equ>.*,?)/.test(row)) {
      const matches = row.match(/^Equipment:\s(?<equ>.*,?)/);
      let equipment = matches.groups.equ.split(',').map((e) => e.trim());
      equipment = equipment.reduce((all, item) => {
        all[item] ? all[item]++ : (all[item] = 1);
        return all;
      }, {});
      for (var e in equipment) {
        deck.push(new DeckRow(e, 'equipment', equipment[e]));
      }

      section = 3;
    }
    if (/^\[(?<amount>\d)\]\s((?<name>.*)\s+\((?<pitch>Red|Yellow|Blue)\)$|(?<cname>.*)$)/.test(row)) {
      const matches = row.match(/^\[(?<amount>\d)\]\s((?<name>.*)\s+\((?<pitch>Red|Yellow|Blue)\)$|(?<cname>.*)$)/);
      let { cname, amount, name, pitch } = matches.groups;
      let type;
      if (cname) {
        name = cname;
        type = 'colorless';
      } else {
        type = `${pitch}`.toLowerCase();
      }
      deck.push(new DeckRow(name, type, Number(amount)));
    }
  }

  return deck;
}

function fabraryToDeck(decklistAsText) {
  const rows = stringToArray(decklistAsText);
  let section = 0;
  const deck = [];

  for (const row of rows) {
    if (/^Hero:\s(?<hero>.*,?)/.test(row)) {
      const matches = row.match(/^Hero:\s(?<hero>.*,?)/);
      deck.push(new DeckRow(matches.groups.hero, 'hero', 1));
      section = 1;
    }
    if (/^Weapons:\s(?<weapons>.*,?)/.test(row)) {
      const matches = row.match(/^Weapons:\s(?<weapons>.*,?)/);
      let weapons = matches.groups.weapons.split(',').map((w) => w.trim());
      weapons = weapons.reduce((all, item) => {
        all[item] ? all[item]++ : (all[item] = 1);
        return all;
      }, {});
      for (var w in weapons) {
        deck.push(new DeckRow(w, 'equipment', weapons[w]));
      }
      section = 2;
    }
    if (/^Equipment:\s(?<equ>.*,?)/.test(row)) {
      const matches = row.match(/^Equipment:\s(?<equ>.*,?)/);
      let equipment = matches.groups.equ.split(',').map((e) => e.trim());
      equipment = equipment.reduce((all, item) => {
        all[item] ? all[item]++ : (all[item] = 1);
        return all;
      }, {});
      for (var e in equipment) {
        deck.push(new DeckRow(e, 'equipment', equipment[e]));
      }

      section = 3;
    }
    if (/^\((?<amount>\d)\)\s(?<name>.*)\s+\((?<pitch>red|yellow|blue|)\)$/.test(row)) {
      const matches = row.match(/^\((?<amount>\d)\)\s(?<name>.*)\s+\((?<pitch>red|yellow|blue|)\)$/);
      let { amount, name, pitch } = matches.groups;
      let type;
      if (!pitch) {
        pitch = 'colorless';
      }
      deck.push(new DeckRow(name, pitch, Number(amount)));
    }
  }

  return deck;
}

function fabtcgToDeck(decklistAsText) {
  const rows = stringToArray(decklistAsText);
  let section = 0;
  const deck = [];

  for (const row of rows) {
    if (/Hero(.*)Weapon(.*)Equipment/.test(row)) {
      section = 1;
    }
    if (/Pitch \d/.test(row)) {
      const matches = row.match(/Pitch (?<pitch>\d)/);
      section = Number(matches.groups.pitch) + 1;
    }
    if (/Others/.test(row)) {
      section = 5;
    }

    if (/^([0-3](\sx\s(.*)))$/.test(row)) {
      const matches = row.match(/(?<amount>\d)\s{0,1}x\s((?<name>.*)\s+\((?<pitch>\d)\)|(?<cname>.*))/);
      let { cname, amount, name, pitch } = matches.groups;
      if (cname) {
        name = cname;
      }
      const type = pitchValueToText(pitch);
      amount = Number(amount);
      switch (section) {
        case 0:
          // wat?
          break;
        case 1: // weapons and equipment
          deck.push(new DeckRow(name, 'equipment', amount));
          break;
        case 2: // pitch 1
        case 3: // pitch 2
        case 4: // pitch 3
        case 5: // others
          deck.push(new DeckRow(name, type, amount));
          break;
      }
    }
  }

  return deck;
}

function oldschoolFormatToDeck(decklistAsText) {
  const rows = stringToArray(decklistAsText);
  const deck = [];

  const allCardNames = cards.map((c) => c.name);

  for (const row of rows) {
    const matches = row.match(/^(?<amount>\d)x?\s(?<name>.+?)(?:\s(\(|\[)(?<pitch>r|y|b|red|yellow|blue|\d)(\)|\]))?$/i);
    if (!matches?.groups) {
      continue;
    }
    let { amount, name, pitch } = matches.groups;

    amount = Number(amount);
    let pitchValue = 'colorless';

    const assumedCardName = closestMatch(name, allCardNames);
    const cardData = cards.filter((c) => c.name == assumedCardName);

    let type;
    if (cardData.length === 1) {
      const card = cardData[0];
      type = card.types[0].toLowerCase();
      if (type == 'weapon') {
        // Weapons go to same slots in sheet as equipments
        type = 'equipment';
      }
      if (card.pitch) {
        // Cards with single pitch version
        pitchValue = ['red', 'yellow', 'blue'][card.pitch - 1];
      }
    }
    if (cardData.length > 1) {
      // Use pitch value as written to decklist
      if (pitch) {
        switch (pitch.toLowerCase()) {
          case '1':
          case 'red':
          case 'r':
            pitchValue = 'red';
            break;
          case '2':
          case 'yellow':
          case 'y':
            pitchValue = 'yellow';
            break;
          case '3':
          case 'blue':
          case 'b':
            pitchValue = 'blue';
            break;
        }
      }
    }

    const nonPitchableCardTypes = ['hero', 'weapon', 'equipment'];

    if (!nonPitchableCardTypes.includes(type)) {
      type = pitchValue;
    }

    const cleanedCardName = assumedCardName.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
    //console.debug(`${row} => ${amount} ${cleanedCardName} ${type}`);
    deck.push(new DeckRow(cleanedCardName, type, amount));
  }

  return deck;
}

function randomFormatToDeck() {
  return [];
}

export function pitchValueToText(pitchNumber) {
  switch (Number(pitchNumber)) {
    case 1:
      return 'red';
    case 2:
      return 'yellow';
    case 3:
      return 'blue';
    default:
      return 'colorless';
  }
}

export function textToPitchValue(pitchText) {
  // Is mapping better/faster than switch? Probably.
  switch (pitchText) {
    case 'red':
      return 1;
    case 'yellow':
      return 2;
    case 'blue':
      return 3;
    default:
      return 0;
  }
}

function stringToArray(text) {
  return text.split(/\r?\n|\r|\n/g);
}
