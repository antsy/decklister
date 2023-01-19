import { default as fileSystem } from 'fs';
import { PDFDocument } from 'pdf-lib';

const localSheetFile = `sheet.pdf`;

export async function getPdfDocument() {
  if (!fileSystem.existsSync(localSheetFile)) {
    await saveDeckRegistrationSheetFromOnline();
  }

  const buffer = fileSystem.readFileSync(localSheetFile);
  const pdfDoc = await PDFDocument.load(buffer);

  return pdfDoc;
}

export async function saveDeckRegistrationSheetFromOnline() {
  const uri = 'https://fabtcg.com/documents/121/fab_deck_resgistration_sheet_updated_FILLABLE.pdf'; // No need to parameterize this, because if this ever changes, everything will break anyways.

  console.log(`Getting ${uri}`);

  const existingPdfBytes = await fetch(uri).then((res) => res.arrayBuffer());

  const pdfDoc = await PDFDocument.load(existingPdfBytes, {
    updateMetadata: false,
  });

  console.log(
    `Document received.

            Title: ${pdfDoc.getTitle()}
           Author: ${pdfDoc.getAuthor()}
          Subject: ${pdfDoc.getSubject()} 
          Creator: ${pdfDoc.getCreator()}
         Keywords: ${pdfDoc.getKeywords()}
         Producer: ${pdfDoc.getProducer()}
    Creation Date: ${pdfDoc.getCreationDate()}
Modification Date: ${pdfDoc.getModificationDate()}
`
  );

  await savePdfDocument(localSheetFile, pdfDoc);
}

export async function savePdfDocument(filename, pdfDoc) {
  fileSystem.writeFileSync(filename, await pdfDoc.save(), (err) => {
    if (err) {
      console.error(`Unable to save ${filename}`);
      throw err;
    }
  });
}
