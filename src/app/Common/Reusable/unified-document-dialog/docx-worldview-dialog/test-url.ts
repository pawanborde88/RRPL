
import { normalizePublicDocumentUrl } from './normalize-public-document-url';

const url = "https://erpbucket2.s3.ap-south-1.amazonaws.com/agreement/Mr_Vinay_Dilip_Mandge_GEO_ARISTO_604_Agreement.docx";
const result = normalizePublicDocumentUrl(url);

console.log("Input:", url);
console.log("Output:", result);
console.log("Encoded for Office:", encodeURIComponent(result));
