import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import { fillPdfDocumentFields } from './debug.mjs';
import { readFromClipboard, readFromFile } from './decklist.mjs';
import { getPdfDocument, savePdfDocument } from './document.mjs';
import { saveToFile } from './pdfwriter.mjs';
import { setupVariables } from './variables.mjs';
import { verify } from './verify.mjs';

const optionList = [
  {
    name: 'input',
    alias: 'i',
    type: String,
    typeLabel: '{underline file}',
    description: 'Read the decklist from a file. If this option is not specified, the decklist will be read from the clipboard.',
  },
  {
    name: 'output',
    alias: 'o',
    type: String,
    typeLabel: '{underline file}',
    defaultOption: 'decklist.pdf',
    description: 'File to save pdf into.',
  },
  {
    name: 'print',
    alias: 'p',
    type: Boolean,
    description: 'After saving the pdf file, print it with printer.',
  },
  {
    name: 'skip-verify',
    alias: 's',
    type: Boolean,
    description: 'Trust the input, skip verification.',
  },
  {
    name: 'halt',
    alias: 'e',
    type: Boolean,
    description: `Stop execution if any verification error occurs.`,
  },
  {
    name: 'skip-interaction',
    alias: 'n',
    type: Boolean,
    description: 'Do not prompt for anything, use .env default values where possible.',
  },
  {
    name: 'form-debug',
    type: Boolean,
    description: 'Create debug sheet with all the form field names written out.',
  },
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    defaultOption: false,
    description: 'Display this usage guide and quit without doing anything.',
  },
];

const cliOptionsConfiguration = [
  {
    header: 'Decklister',
    content:
      'Form filler for {italic Flesh & Blood} card game deck lists.\n\nDefault operation is to read deck list information from the clipboard and generate a pdf file.',
  },
  {
    header: 'Options',
    optionList: optionList,
  },
];

const options = commandLineArgs(optionList);

if (options.help) {
  console.log(commandLineUsage(cliOptionsConfiguration));
  process.exit(0);
}

if (options['form-debug']) {
  let pdfDocument = await getPdfDocument();
  pdfDocument = fillPdfDocumentFields(pdfDocument);
  const filename = 'debug.pdf';
  await savePdfDocument(filename, pdfDocument);
  console.log(`Debug pdf file '${filename}' has been created.`);
  process.exit(0);
}

const decklist = options.input ? readFromFile(options.input) : readFromClipboard();

const heroFromDecklist = decklist.find((c) => c.type === 'hero')?.name;
const variables = await setupVariables(options, heroFromDecklist);

if (!options['skip-verify']) {
  verify(decklist, options);
}

await saveToFile(decklist, options, variables);
