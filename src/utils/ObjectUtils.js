export const objectUtils = {
  OPERATION_TYPES: {
    NO_CHANGE: "NO_CHANGE",
    EMPTY_EMPTY: "EMPTY_EMPTY",
    INIT_SINGLE: "INIT_SINGLE",
    INIT_MULTIPLE: "INIT_MULTIPLE",
    ADD_SINGLE: "ADD_SINGLE",
    ADD_MULTIPLE: "ADD_MULTIPLE",
    DELETE_SINGLE: "DELETE_SINGLE",
    DELETE_MULTIPLE: "DELETE_MULTIPLE",
    CLEAR_ALL: "CLEAR_ALL",
    REPLACE_ELEMENTS: "REPLACE_ELEMENTS",
    PROPERTY_CHANGE: "PROPERTY_CHANGE",
    UNKNOWN: "UNKNOWN",
  },

  detectOperation: (oldElements, newElements) => {
    if (!Array.isArray(oldElements)) oldElements = [];
    if (!Array.isArray(newElements)) newElements = [];

    // 1. FIRST CHECK: Same array reference
    if (oldElements === newElements) {
      return objectUtils.OPERATION_TYPES.NO_CHANGE;
    }

    const oldCount = oldElements.length;
    const newCount = newElements.length;

    // 2. EMPTY SCENARIOS
    if (oldCount === 0 && newCount === 0) {
      return objectUtils.OPERATION_TYPES.EMPTY_EMPTY;
    }

    if (oldCount === 0 && newCount > 0) {
      if (newCount === 1) {
        return objectUtils.OPERATION_TYPES.INIT_SINGLE;
      } else {
        return objectUtils.OPERATION_TYPES.INIT_MULTIPLE;
      }
    }

    if (oldCount > 0 && newCount === 0) {
      return objectUtils.OPERATION_TYPES.CLEAR_ALL;
    }

    // 3. COUNT CHANGES
    if (newCount > oldCount) {
      const diff = newCount - oldCount;
      if (diff === 1) {
        return objectUtils.OPERATION_TYPES.ADD_SINGLE;
      } else {
        return objectUtils.OPERATION_TYPES.ADD_MULTIPLE;
      }
    }

    if (newCount < oldCount) {
      const diff = oldCount - newCount;
      if (diff === 1) {
        return objectUtils.OPERATION_TYPES.DELETE_SINGLE;
      } else {
        return objectUtils.OPERATION_TYPES.DELETE_MULTIPLE;
      }
    }

    // 4. SAME COUNT - Check for structural changes
    if (newCount === oldCount) {
      const oldIds = oldElements.map((el) => el.id).sort();
      const newIds = newElements.map((el) => el.id).sort();

      if (JSON.stringify(oldIds) !== JSON.stringify(newIds)) {
        return objectUtils.OPERATION_TYPES.REPLACE_ELEMENTS;
      }

      return objectUtils.OPERATION_TYPES.PROPERTY_CHANGE;
    }

    return objectUtils.OPERATION_TYPES.UNKNOWN;
  },

  shouldAllowRerender: (operation) => {
    switch (operation) {
      case objectUtils.OPERATION_TYPES.INIT_SINGLE:
      case objectUtils.OPERATION_TYPES.INIT_MULTIPLE:
      case objectUtils.OPERATION_TYPES.ADD_SINGLE:
      case objectUtils.OPERATION_TYPES.ADD_MULTIPLE:
      case objectUtils.OPERATION_TYPES.DELETE_SINGLE:
      case objectUtils.OPERATION_TYPES.DELETE_MULTIPLE:
      case objectUtils.OPERATION_TYPES.CLEAR_ALL:
      case objectUtils.OPERATION_TYPES.REPLACE_ELEMENTS:
      case objectUtils.OPERATION_TYPES.EMPTY_EMPTY:
        return true;

      case objectUtils.OPERATION_TYPES.NO_CHANGE:
      case objectUtils.OPERATION_TYPES.PROPERTY_CHANGE:
        return false;

      case objectUtils.OPERATION_TYPES.UNKNOWN:
      default:
        return true;
    }
  },
};
