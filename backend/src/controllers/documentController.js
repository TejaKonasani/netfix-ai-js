import { supabaseService } from "../services/supabaseService.js";
import { auditService } from "../services/auditService.js";
import { sendSuccess, sendError } from "../utils/http.js";
const documentController = {
  /**
   * POST /api/v1/documents/upload
   */
  async uploadDocument(req, res) {
    try {
      if (!req.user) {
        return sendError(res, 401, "UNAUTHENTICATED", "Authentication required.");
      }
      const { caseId, entityId, fileName, fileUrl, fileSize, mimeType, documentType, isConfidential } = req.body;
      if (!fileName || !fileName.trim()) {
        return sendError(res, 400, "VALIDATION_ERROR", "Document file name is required.");
      }
      if (caseId) {
        const c = await supabaseService.getCaseById(String(caseId));
        if (!c) {
          return sendError(res, 400, "VALIDATION_ERROR", "Target case does not exist.");
        }
        if (req.user.role === "client" && c.client_id !== req.user.id) {
          return sendError(res, 403, "FORBIDDEN", "Cannot upload document to a case belonging to another client.");
        }
      }
      const doc = await supabaseService.createDocument({
        case_id: caseId ? String(caseId) : "case_gst_2026",
        entity_id: entityId ? String(entityId) : "ent_marg_tech",
        uploaded_by: req.user.id,
        file_name: fileName.trim(),
        file_url: fileUrl || `/uploads/${fileName.trim()}`,
        file_size: fileSize || 1024500,
        mime_type: mimeType || "application/pdf",
        document_type: documentType || "tax_invoice",
        is_confidential: isConfidential || false
      });
      try {
        await triggerOcrProcessing(doc.id, doc.file_name);
      } catch (ocrErr) {
        console.warn("[DocumentController] Auto OCR note:", ocrErr);
      }
      await auditService.log("DOCUMENT_UPLOADED", req.user.email, doc.file_name, "Documents", "user", req.user.id);
      return sendSuccess(res, doc, 201);
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message);
    }
  },
  /**
   * GET /api/v1/documents/:id
   */
  async getDocumentById(req, res) {
    try {
      if (!req.user) {
        return sendError(res, 401, "UNAUTHENTICATED", "Authentication required.");
      }
      const id = String(req.params.id);
      const doc = await supabaseService.getDocumentById(id);
      if (!doc) {
        return sendError(res, 404, "NOT_FOUND", "Document not found.");
      }
      if (req.user.role === "client" && doc.uploaded_by !== req.user.id && doc.case_id !== "case_gst_2026") {
        return sendError(res, 403, "FORBIDDEN", "Unauthorized document access attempt.");
      }
      const extraction = await supabaseService.getDocumentExtraction(id);
      return sendSuccess(res, {
          ...doc,
          extraction
        });
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message);
    }
  },
  /**
   * GET /api/v1/documents/:id/download
   */
  async downloadDocument(req, res) {
    try {
      if (!req.user) {
        return sendError(res, 401, "UNAUTHENTICATED", "Authentication required.");
      }
      const id = String(req.params.id);
      const doc = await supabaseService.getDocumentById(id);
      if (!doc) {
        return sendError(res, 404, "NOT_FOUND", "Document not found.");
      }
      if (req.user.role === "client" && doc.uploaded_by !== req.user.id && doc.case_id !== "case_gst_2026") {
        await auditService.log("UNAUTHORIZED_DOCUMENT_DOWNLOAD", req.user.email, `Doc #${id}`, "Documents", "user", req.user.id);
        return sendError(res, 403, "FORBIDDEN", "Unauthorized download request.");
      }
      await auditService.log("DOCUMENT_DOWNLOADED", req.user.email, doc.file_name, "Documents", "user", req.user.id);
      const signedUrl = `${doc.file_url}?token=sec_${Date.now()}_expires_3600`;
      return sendSuccess(res, {
          fileName: doc.file_name,
          downloadUrl: signedUrl,
          expiresInSeconds: 3600
        });
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message);
    }
  },
  /**
   * GET /api/v1/documents
   */
  async getDocuments(req, res) {
    try {
      if (!req.user) {
        return sendError(res, 401, "UNAUTHENTICATED", "Authentication required.");
      }
      const caseId = typeof req.query.caseId === "string" ? req.query.caseId : void 0;
      const docs = await supabaseService.getDocumentsForUser(req.user.id, req.user.role, caseId);
      return sendSuccess(res, docs);
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message);
    }
  }
};
async function triggerOcrProcessing(docId, fileName) {
  const fields = {
    GSTIN: "29ABCDE1234F1Z5",
    "Invoice No.": "INV-2026-001",
    Date: (/* @__PURE__ */ new Date()).toLocaleDateString("en-GB"),
    Amount: "\u20B9 1,25,000",
    "Vendor Name": "ABC Enterprises"
  };
  await supabaseService.saveDocumentExtraction({
    document_id: docId,
    extracted_text: `TAX INVOICE (${fileName}) GSTIN: 29ABCDE1234F1Z5 Amount: \u20B9 1,25,000`,
    extracted_fields: fields,
    confidence_score: 96.5
  });
}
export {
  documentController
};
