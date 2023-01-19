# Deck list filler for Flesh & Blood

This software does the following:

 * Gets the decklist template PDF base from LSS's server and stores it for you locally ([sheet.pdf](./sheet.pdf))
 * Reads your decklist from clipboard (or from file)
 * Tries to detect if your decklist is from [fabdb](https://fabdb.net/decks/browse), [fabrary](https://fabrary.net/decks), [fabtcg](https://fabtcg.com/decklists/) or perhaps just some list of card names
 * Verifies that card names are valid
 * Asks for your information (reads default values from `.env` -file)
 * Fills in the cards in the official form

## Usage

1. Run `npm i` to install dependencies.
2. Copy some decklist as text into your clipboard.
3. Run `npm start` to write that decklist into the output file.

Optional: fill in [`.env`](./.env) file. See [`.env_example`](./.env_example) as example.

Optional: run `npm start -- -h` to see the command line parameters.

## Requirements

Node version 18+ required

## Notes

Uses neat [`fab-cards`](https://www.npmjs.com/package/fab-cards) -package to verify card names.
Remember to update this package when new sets are released, otherwise your cards won't be recognized.
The verification will only check that the listed cards exist in the fab-cards -database, it does not check if your decklist is actually legal to be played with.

## Disclaimer

There is no warranty! If you get penalized for having an illegal decklist in your tournament, don't blame the software, it is your own fault for not checking yourself!
