import * as dotenv from 'dotenv';
import { cards } from 'fab-cards';
import inquirer from 'inquirer';

export async function setupVariables(options, heroFromDecklist) {
  process.env = {};
  dotenv.config();
  const { NAME, PRONOUN, GEM_ID, EVENT, LOCALE } = process.env;

  if (NAME) {
    console.log(`Oh hi ${NAME}`);
  }

  const now = new Date();
  let variables = {
    name: NAME ? NAME : 'Nobody',
    pronoun: PRONOUN ? PRONOUN : 'it',
    gem_id: GEM_ID ? GEM_ID : 'Unknown',
    event: EVENT ? EVENT : 'Kitchen table',
    date: now.toLocaleDateString(LOCALE ? LOCALE : 'fi-FI'), // "localize it!" -- Peter Tosh, probably
    hero: heroFromDecklist ? heroFromDecklist : '',
  };

  if (options['skip-interaction']) {
    return variables;
  }

  await inquirer
    .prompt([
      {
        name: 'name',
        message: 'What is your full name?',
        default: variables.name,
      },
      {
        name: 'pronoun',
        message: 'What pronouns you use?',
        default: variables.pronoun,
      },
      {
        name: 'gem_id',
        message: 'What is your GEM ID?',
        default: variables.gem_id,
      },
      {
        name: 'event',
        message: 'Name of the event the deck is for?',
        default: variables.event,
      },
      {
        name: 'date',
        message: 'What is the event date?',
        default: variables.date,
      },
    ])
    .then((answers) => {
      variables = { hero: variables.hero, ...answers };
    })
    .catch((error) => {
      if (error.isTtyError) {
        throw new Error(`Current environment does not accept interactive input`);
      } else {
        throw error;
      }
    });

  if (!variables.hero) {
    variables.hero = await heroPicker(variables, cards);
  }

  return variables;
}

async function heroPicker(variables, cards) {
  let heronames;
  await inquirer
    .prompt([
      {
        // TODO: I'm sure this selection UX could be improved somehow
        type: 'expand',
        name: 'format',
        message: 'Is the format using adult (Classic Constructed) or young heroes (Blitz)?',
        choices: [
          {
            key: 'a',
            value: 'adult',
          },
          {
            key: 'y',
            value: 'young',
          },
          {
            key: 'b',
            value: 'both',
          },
        ],
      },
    ])
    .then((answers) => {
      heronames = cards
        .filter((c) => c.hero)
        .filter((c) => {
          return answers.format == 'both' || (answers.format == 'adult' && !c.young) || (answers.format == 'young' && c.young);
        })
        .map((h) => {
          return h.name;
        });
    })
    .catch((error) => {
      if (error.isTtyError) {
        throw new Error(`Current environment does not accept interactive input`);
      } else {
        throw error;
      }
    });

  await inquirer
    .prompt([
      {
        type: 'list',
        name: 'hero',
        message: 'Which hero are you using?',
        default: variables.hero,
        choices: heronames,
      },
    ])
    .then((answers) => {
      variables.hero = answers.hero;
    })
    .catch((error) => {
      if (error.isTtyError) {
        throw new Error(`Current environment does not accept interactive input`);
      } else {
        throw error;
      }
    });

  return variables.hero;
}
