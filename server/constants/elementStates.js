/**
 * Element State Constants
 * 
 * These constants define the lifecycle states of elements in the system.
 * Used by both frontend and backend for consistency.
 * 
 * Note: These should match the frontend constants exactly.
 */

export const ELEMENT_STATES = {
  /**
   * NEW - Element has been created/uploaded but not yet saved to permanent storage
   * - Applied to newly added elements
   * - Elements in temporary storage
   * - Transitions to PERSISTED when canvas is saved
   */
  NEW: "N",

  /**
   * PERSISTED - Element has been saved to permanent storage
   * - Applied to elements loaded from database
   * - Applied to NEW elements after successful save
   * - Stable state for elements that exist in the system
   */
  PERSISTED: "P",

  /**
   * REMOVED - Element has been marked for deletion
   * - Applied when user removes a PERSISTED element from canvas
   * - Element will be deleted from storage when canvas is saved
   * - Cannot be reverted once marked for removal
   */
  REMOVED: "R",
};

/**
 * Helper functions for working with element states
 */
export const ElementStateHelpers = {
  /**
   * Check if an element is in a new state
   */
  isNew: (state) => state === ELEMENT_STATES.NEW,

  /**
   * Check if an element is persisted
   */
  isPersisted: (state) => state === ELEMENT_STATES.PERSISTED,

  /**
   * Check if an element is marked for removal
   */
  isRemoved: (state) => state === ELEMENT_STATES.REMOVED,

  /**
   * Get all valid state values
   */
  getAllStates: () => Object.values(ELEMENT_STATES),

  /**
   * Validate if a state value is valid
   */
  isValidState: (state) => Object.values(ELEMENT_STATES).includes(state),

  /**
   * Get human-readable description of a state
   */
  getStateDescription: (state) => {
    switch (state) {
      case ELEMENT_STATES.NEW:
        return "New (not yet saved)";
      case ELEMENT_STATES.PERSISTED:
        return "Persisted (saved to storage)";
      case ELEMENT_STATES.REMOVED:
        return "Removed (marked for deletion)";
      default:
        return "Unknown state";
    }
  },
};
