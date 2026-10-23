import { supabaseService } from "../services/supabaseService.js";
import { auditService } from "../services/auditService.js";
import { sendSuccess, sendError } from "../utils/http.js";
const entityController = {
  /**
   * POST /api/v1/entities
   */
  async createEntity(req, res) {
    try {
      if (!req.user) {
        return sendError(res, 401, "UNAUTHENTICATED", "Authentication required.");
      }
      const { name, type, gstin, pan, registeredAddress, city, state } = req.body;
      if (!name || !name.trim()) {
        return sendError(res, 400, "VALIDATION_ERROR", "Company/Entity Name is required.");
      }
      if (!registeredAddress || !registeredAddress.trim()) {
        return sendError(res, 400, "VALIDATION_ERROR", "Registered Address is required.");
      }
      const entity = await supabaseService.createEntity({
        name: name.trim(),
        type: type || "company",
        gstin: gstin ? gstin.trim().toUpperCase() : "",
        pan: pan ? pan.trim().toUpperCase() : "",
        registered_address: registeredAddress.trim(),
        city: city ? city.trim() : "",
        state: state ? state.trim() : "",
        owner_user_id: req.user.id
      });
      await auditService.log("ENTITY_CREATED", req.user.email, entity.name, "Entities", "user", req.user.id);
      return sendSuccess(res, entity, 201);
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message);
    }
  },
  /**
   * GET /api/v1/entities
   */
  async getEntities(req, res) {
    try {
      if (!req.user) {
        return sendError(res, 401, "UNAUTHENTICATED", "Authentication required.");
      }
      const entities = await supabaseService.getEntitiesForUser(req.user.id, req.user.role);
      return sendSuccess(res, entities);
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message);
    }
  },
  /**
   * GET /api/v1/entities/:id
   */
  async getEntityById(req, res) {
    try {
      if (!req.user) {
        return sendError(res, 401, "UNAUTHENTICATED", "Authentication required.");
      }
      const id = String(req.params.id);
      const entity = await supabaseService.getEntityById(id);
      if (!entity) {
        return sendError(res, 404, "NOT_FOUND", "Entity not found.");
      }
      if (req.user.role === "client" && entity.owner_user_id !== req.user.id) {
        return sendError(res, 403, "FORBIDDEN", "Access denied. You do not own or manage this entity.");
      }
      return sendSuccess(res, entity);
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message);
    }
  },
  /**
   * PATCH /api/v1/entities/:id
   */
  async updateEntity(req, res) {
    try {
      if (!req.user) {
        return sendError(res, 401, "UNAUTHENTICATED", "Authentication required.");
      }
      const id = String(req.params.id);
      const entity = await supabaseService.getEntityById(id);
      if (!entity) {
        return sendError(res, 404, "NOT_FOUND", "Entity not found.");
      }
      if (req.user.role === "client" && entity.owner_user_id !== req.user.id) {
        return sendError(res, 403, "FORBIDDEN", "Access denied. You cannot edit this entity.");
      }
      const updated = await supabaseService.updateEntity(id, req.body);
      await auditService.log("ENTITY_UPDATED", req.user.email, entity.name, "Entities", "user", req.user.id);
      return sendSuccess(res, updated);
    } catch (err) {
      return sendError(res, 500, "SERVER_ERROR", err.message);
    }
  }
};
export {
  entityController
};
