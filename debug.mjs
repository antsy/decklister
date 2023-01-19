export function listPdfDocumentFields(pdfDocument) {
  const pdfForm = pdfDocument.getForm();
  const fields = pdfForm.getFields();
  for (const field of fields) {
    console.log(field.getName());
  }
}

export function fillPdfDocumentFields(pdfDocument) {
  const pdfForm = pdfDocument.getForm();
  const fields = pdfForm.getFields();
  for (const field of fields) {
    field.setText(field.getName());
  }

  return pdfDocument;
}

export function getPdfFields(pdfDocument) {
  const pdfForm = pdfDocument.getForm();
  const fields = pdfForm.getFields();
  return fields;
}
