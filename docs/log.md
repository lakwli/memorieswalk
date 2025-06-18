when create textA:
🏗️ createElement called: useCanvasElements.js:106:13
🏗️ Type: text useCanvasElements.js:107:13
🏗️ Props:
Object { }
useCanvasElements.js:108:13
🏗️ Created element: text-q5se784xl useCanvasElements.js:111:13
🏗️ setElements updating: useCanvasElements.js:118:15
🏗️ Previous elements:
Array []
useCanvasElements.js:119:15
🏗️ New elements:
Array [ "text-q5se784xl" ]
useCanvasElements.js:123:15
🏗️ createElement completed, returning: text-q5se784xl useCanvasElements.js:130:13
🎯 addElementIntoCanvas called for: text-q5se784xl text useElementBehaviors.js:46:13
🎯 Element size BEFORE positioning:
Object { elementId: "text-q5se784xl", elementType: "text", elementWidth: 200, elementHeight: 60, originalWidth: undefined, originalHeight: undefined }
useElementBehaviors.js:52:13
🎯 Detailed positioning debug:
Object { elementType: "text", stage: {…}, stagePosition: {…}, viewportCenter: {…}, elementBounds: {…}, elementSize: {…} }
useElementBehaviors.js:73:15
🔍 POSITIONING STEP BY STEP:
Object { elementType: "text", elementId: "text-q5se784xl", step1_viewportCenter: {…}, step2_elementSize: {…}, step3_calculation: {…}, step4_beforeUpdate: {…} }
useElementBehaviors.js:86:15
🎯 Element positioned:
Object { elementId: "text-q5se784xl", elementType: "text", calculatedPosition: {…}, actualPosition: {…}, positionMatch: true }
useElementBehaviors.js:102:15
🔍 SETTING UP POSITION MONITOR for: text-q5se784xl useElementBehaviors.js:111:15
🔄 updateSelectedElement called:
Object { id: "text-q5se784xl", type: "text", x: 830, y: 264, width: 200, height: 60, rotation: 0, draggable: true, selectable: true, deletable: true, … }
useCanvasElements.js:13:13
🏠 MemoryEditorPage #131 - Instance: mem-editor-1750255440154 MemoryEditorPage.jsx:81:11
🏠 MemoryEditorPage render #131 MemoryEditorPage.jsx:84:11
🏠 MemoryEditorPage timestamp: 2025-06-18T14:04:05.919Z MemoryEditorPage.jsx:85:11
🔄 Different element - updating useCanvasElements.js:22:15
🔍 useElementBehaviors called with:
Object { updateElement: true, setSelectedElement: true, editingManager: true, removeElement: true }
useElementBehaviors.js:10:11
🔍 useMemo dependencies check: MemoryEditorPage.jsx:112:11

- elements length: 1 MemoryEditorPage.jsx:113:11
- editingManager: true MemoryEditorPage.jsx:114:11
- updateElement: function MemoryEditorPage.jsx:115:11
- elementBehaviors: true MemoryEditorPage.jsx:116:11
- setNewSelectedElement: function MemoryEditorPage.jsx:117:11
  🔍 About to call useUploadManager with config:
  Object { onUploadComplete: "function", addPhotoElementsIntoCanvasString: 'async (imageDataArray) => {\n console.log("🚀 ' }
  MemoryEditorPage.jsx:285:11
  🔍 Upload Manager state:
  Object { isUploading: false, uploadStatus: "", currentProgress: 0, currentPhase: "" }
  MemoryEditorPage.jsx:302:11
  🔄 MemoryEditorPage render method called from , Instance: ${instanceId} MemoryEditorPage.jsx:1435:13
  🔍 RendererFactory createRenderer RendererFactory.jsx:17:13
  🔍 RendererFactory element.type text RendererFactory.jsx:18:13
  🔍 RendererFactory render count for text-text-q5se784xl : 1 RendererFactory.jsx:19:13
  🔍 RendererFactory elementProps keys:
  Array(5) [ "onUpdate", "interactionHandlers", "isBeingEdited", "onEditStart", "onEditEnd" ]
  RendererFactory.jsx:31:13
  🔍 RendererFactory isBeingEdited: false RendererFactory.jsx:32:13
  🎯 ===== ElementToolbar RENDER START ===== ElementToolbar.jsx:39:11
  🎯 updateElementId: undefined ElementToolbar.jsx:40:11
  🎯 Element ID: text-q5se784xl ElementToolbar.jsx:41:11
  🎯 Element position:
  Object { x: 830, y: 264 }
  ElementToolbar.jsx:42:11
  🎯 StageRef exists: true ElementToolbar.jsx:43:11
  🎯 Render timestamp: 2025-06-18T14:04:05.996Z ElementToolbar.jsx:44:11
  🎯 getToolbarPosition called ElementToolbar.jsx:61:13
  🎯 Stage found, looking for node with ID: text-q5se784xl ElementToolbar.jsx:72:13
  🎯 Node found: false undefined ElementToolbar.jsx:74:13
  🎯 Node not found! Available nodes with IDs: ElementToolbar.jsx:76:15
  🎯 Available nodes:
  Array []
  ElementToolbar.jsx:83:15
  🎯 Using fallback position calculation: ElementToolbar.jsx:89:15
  🎯 Stage container rect:
  DOMRect { x: 60, y: 60, width: 1860, height: 588, top: 60, right: 1920, bottom: 648, left: 60 }
  ElementToolbar.jsx:90:15
  🎯 Stage scale: 1 ElementToolbar.jsx:91:15
  🎯 Stage position:
  Object { x: 0, y: 0 }
  ElementToolbar.jsx:92:15
  🎯 Element logical position:
  Object { x: 830, y: 264 }
  ElementToolbar.jsx:93:15
  🎯 Calculated screen position:
  Object { x: 890, y: 324 }
  ElementToolbar.jsx:97:15
  🎯 Toolbar will render at position:
  Object { top: 204, left: 890 }
  ElementToolbar.jsx:150:11
  🎯 ===== ElementToolbar RENDER END ===== ElementToolbar.jsx:151:11
  🎯 BaseRenderer rendering: text-q5se784xl BaseRenderer.jsx:111:13
  🔍 TextRenderer elementProps:
  Object { ref: {…}, id: "text-q5se784xl", type: "text", x: 830, y: 264, width: 200, height: 60, rotation: 0, draggable: true, selectable: true, … }
  TextRenderer.jsx:234:13
  🔍 Element ID: text-q5se784xl TextRenderer.jsx:235:13
  🔍 Element getProps():
  Object { id: "text-q5se784xl", type: "text", x: 830, y: 264, width: 200, height: 60, rotation: 0, draggable: true, selectable: true, deletable: true, … }
  TextRenderer.jsx:236:13
  🔍 Dependency comparison: MemoryEditorPage.jsx:155:15
  ❌ elementsLength CHANGED: MemoryEditorPage.jsx:160:19
  From: 0 MemoryEditorPage.jsx:161:19
  To: 1 MemoryEditorPage.jsx:162:19
  ❌ elementsIds CHANGED: MemoryEditorPage.jsx:160:19
  From: MemoryEditorPage.jsx:161:19
  To: text-q5se784xl MemoryEditorPage.jsx:162:19
  ✅ editingManagerType unchanged MemoryEditorPage.jsx:164:19
  ✅ updateElementString unchanged MemoryEditorPage.jsx:164:19
  ✅ elementBehaviorsType unchanged MemoryEditorPage.jsx:164:19
  ✅ setNewSelectedElementString unchanged MemoryEditorPage.jsx:164:19
  🔵 useEffect #6 - Keyboard events fired MemoryEditorPage.jsx:688:13
- selectedElement: text-q5se784xl MemoryEditorPage.jsx:689:13
- editingElement: null MemoryEditorPage.jsx:690:13
  🔍 POSITION CHECK #1 for text text-q5se784xl:
  Object { timestamp: "2025-06-18T14:04:06.108Z", currentPosition: {…}, expectedPosition: {…}, positionChanged: false, drift: {…} }
  useElementBehaviors.js:119:17
  🔍 POSITION CHECK #2 for text text-q5se784xl:
  Object { timestamp: "2025-06-18T14:04:06.210Z", currentPosition: {…}, expectedPosition: {…}, positionChanged: false, drift: {…} }
  useElementBehaviors.js:119:17
  🔍 POSITION CHECK #3 for text text-q5se784xl:
  Object { timestamp: "2025-06-18T14:04:06.311Z", currentPosition: {…}, expectedPosition: {…}, positionChanged: false, drift: {…} }
  useElementBehaviors.js:119:17
  🔍 POSITION CHECK #4 for text text-q5se784xl:
  Object { timestamp: "2025-06-18T14:04:06.422Z", currentPosition: {…}, expectedPosition: {…}, positionChanged: false, drift: {…} }
  useElementBehaviors.js:119:17
  🔍 POSITION CHECK #5 for text text-q5se784xl:
  Object { timestamp: "2025-06-18T14:04:06.524Z", currentPosition: {…}, expectedPosition: {…}, positionChanged: false, drift: {…} }
  useElementBehaviors.js:119:17
  🔍 POSITION CHECK #6 for text text-q5se784xl:
  Object { timestamp: "2025-06-18T14:04:06.626Z", currentPosition: {…}, expectedPosition: {…}, positionChanged: false, drift: {…} }
  useElementBehaviors.js:119:17
  🔍 POSITION CHECK #7 for text text-q5se784xl:
  Object { timestamp: "2025-06-18T14:04:06.726Z", currentPosition: {…}, expectedPosition: {…}, positionChanged: false, drift: {…} }
  useElementBehaviors.js:119:17
  🔍 POSITION CHECK #8 for text text-q5se784xl:
  Object { timestamp: "2025-06-18T14:04:06.827Z", currentPosition: {…}, expectedPosition: {…}, positionChanged: false, drift: {…} }
  useElementBehaviors.js:119:17
  🔍 POSITION CHECK #9 for text text-q5se784xl:
  Object { timestamp: "2025-06-18T14:04:06.928Z", currentPosition: {…}, expectedPosition: {…}, positionChanged: false, drift: {…} }
  useElementBehaviors.js:119:17
  🔍 POSITION CHECK #10 for text text-q5se784xl:
  Object { timestamp: "2025-06-18T14:04:07.028Z", currentPosition: {…}, expectedPosition: {…}, positionChanged: false, drift: {…} }
  useElementBehaviors.js:119:17

when create textB:
🏗️ createElement called: useCanvasElements.js:106:13
🏗️ Type: text useCanvasElements.js:107:13
🏗️ Props:
Object { }
useCanvasElements.js:108:13
🏗️ Created element: text-ymez6m1f3 useCanvasElements.js:111:13
🏗️ setElements updating: useCanvasElements.js:118:15
🏗️ Previous elements:
Array [ "text-q5se784xl" ]
useCanvasElements.js:119:15
🏗️ New elements:
Array [ "text-q5se784xl", "text-ymez6m1f3" ]
useCanvasElements.js:123:15
🏗️ createElement completed, returning: text-ymez6m1f3 useCanvasElements.js:130:13
🎯 addElementIntoCanvas called for: text-ymez6m1f3 text useElementBehaviors.js:46:13
🎯 Element size BEFORE positioning:
Object { elementId: "text-ymez6m1f3", elementType: "text", elementWidth: 200, elementHeight: 60, originalWidth: undefined, originalHeight: undefined }
useElementBehaviors.js:52:13
🎯 Detailed positioning debug:
Object { elementType: "text", stage: {…}, stagePosition: {…}, viewportCenter: {…}, elementBounds: {…}, elementSize: {…} }
useElementBehaviors.js:73:15
🔍 POSITIONING STEP BY STEP:
Object { elementType: "text", elementId: "text-ymez6m1f3", step1_viewportCenter: {…}, step2_elementSize: {…}, step3_calculation: {…}, step4_beforeUpdate: {…} }
useElementBehaviors.js:86:15
🎯 Element positioned:
Object { elementId: "text-ymez6m1f3", elementType: "text", calculatedPosition: {…}, actualPosition: {…}, positionMatch: true }
useElementBehaviors.js:102:15
🔍 SETTING UP POSITION MONITOR for: text-ymez6m1f3 useElementBehaviors.js:111:15
🔄 updateSelectedElement called:
Object { id: "text-ymez6m1f3", type: "text", x: 830, y: 264, width: 200, height: 60, rotation: 0, draggable: true, selectable: true, deletable: true, … }
useCanvasElements.js:13:13
🏠 MemoryEditorPage #132 - Instance: mem-editor-1750255440154 MemoryEditorPage.jsx:81:11
🏠 MemoryEditorPage render #132 MemoryEditorPage.jsx:84:11
🏠 MemoryEditorPage timestamp: 2025-06-18T14:05:06.193Z MemoryEditorPage.jsx:85:11
🔄 Different element - updating useCanvasElements.js:22:15
🔍 useElementBehaviors called with:
Object { updateElement: true, setSelectedElement: true, editingManager: true, removeElement: true }
useElementBehaviors.js:10:11
🔍 useMemo dependencies check: MemoryEditorPage.jsx:112:11

- elements length: 2 MemoryEditorPage.jsx:113:11
- editingManager: true MemoryEditorPage.jsx:114:11
- updateElement: function MemoryEditorPage.jsx:115:11
- elementBehaviors: true MemoryEditorPage.jsx:116:11
- setNewSelectedElement: function MemoryEditorPage.jsx:117:11
  🔍 About to call useUploadManager with config:
  Object { onUploadComplete: "function", addPhotoElementsIntoCanvasString: 'async (imageDataArray) => {\n console.log("🚀 ' }
  MemoryEditorPage.jsx:285:11
  🔍 Upload Manager state:
  Object { isUploading: false, uploadStatus: "", currentProgress: 0, currentPhase: "" }
  MemoryEditorPage.jsx:302:11
  🔄 MemoryEditorPage render method called from , Instance: ${instanceId} MemoryEditorPage.jsx:1435:13
  🔍 RendererFactory createRenderer RendererFactory.jsx:17:13
  🔍 RendererFactory element.type text RendererFactory.jsx:18:13
  🔍 RendererFactory render count for text-text-q5se784xl : 2 RendererFactory.jsx:19:13
  🔍 RendererFactory elementProps keys:
  Array(5) [ "onUpdate", "interactionHandlers", "isBeingEdited", "onEditStart", "onEditEnd" ]
  RendererFactory.jsx:31:13
  🔍 RendererFactory isBeingEdited: false RendererFactory.jsx:32:13
  🔍 RendererFactory createRenderer RendererFactory.jsx:17:13
  🔍 RendererFactory element.type text RendererFactory.jsx:18:13
  🔍 RendererFactory render count for text-text-ymez6m1f3 : 1 RendererFactory.jsx:19:13
  🔍 RendererFactory elementProps keys:
  Array(5) [ "onUpdate", "interactionHandlers", "isBeingEdited", "onEditStart", "onEditEnd" ]
  RendererFactory.jsx:31:13
  🔍 RendererFactory isBeingEdited: false RendererFactory.jsx:32:13
  🎯 ===== ElementToolbar RENDER START ===== ElementToolbar.jsx:39:11
  🎯 updateElementId: undefined ElementToolbar.jsx:40:11
  🎯 Element ID: text-ymez6m1f3 ElementToolbar.jsx:41:11
  🎯 Element position:
  Object { x: 830, y: 264 }
  ElementToolbar.jsx:42:11
  🎯 StageRef exists: true ElementToolbar.jsx:43:11
  🎯 Render timestamp: 2025-06-18T14:05:06.262Z ElementToolbar.jsx:44:11
  🎯 getToolbarPosition called ElementToolbar.jsx:61:13
  🎯 Stage found, looking for node with ID: text-ymez6m1f3 ElementToolbar.jsx:72:13
  🎯 Node found: false undefined ElementToolbar.jsx:74:13
  🎯 Node not found! Available nodes with IDs: ElementToolbar.jsx:76:15
  🎯 Available nodes:
  Array []
  ElementToolbar.jsx:83:15
  🎯 Using fallback position calculation: ElementToolbar.jsx:89:15
  🎯 Stage container rect:
  DOMRect { x: 60, y: 60, width: 1860, height: 588, top: 60, right: 1920, bottom: 648, left: 60 }
  ElementToolbar.jsx:90:15
  🎯 Stage scale: 1 ElementToolbar.jsx:91:15
  🎯 Stage position:
  Object { x: 0, y: 0 }
  ElementToolbar.jsx:92:15
  🎯 Element logical position:
  Object { x: 830, y: 264 }
  ElementToolbar.jsx:93:15
  🎯 Calculated screen position:
  Object { x: 890, y: 324 }
  ElementToolbar.jsx:97:15
  🎯 Toolbar will render at position:
  Object { top: 204, left: 890 }
  ElementToolbar.jsx:150:11
  🎯 ===== ElementToolbar RENDER END ===== ElementToolbar.jsx:151:11
  🎯 BaseRenderer rendering: text-q5se784xl BaseRenderer.jsx:111:13
  🔍 TextRenderer elementProps:
  Object { ref: {…}, id: "text-q5se784xl", type: "text", x: 830, y: 264, width: 200, height: 60, rotation: 0, draggable: true, selectable: true, … }
  TextRenderer.jsx:234:13
  🔍 Element ID: text-q5se784xl TextRenderer.jsx:235:13
  🔍 Element getProps():
  Object { id: "text-q5se784xl", type: "text", x: 830, y: 264, width: 200, height: 60, rotation: 0, draggable: true, selectable: true, deletable: true, … }
  TextRenderer.jsx:236:13
  🎯 BaseRenderer rendering: text-ymez6m1f3 BaseRenderer.jsx:111:13
  🔍 TextRenderer elementProps:
  Object { ref: {…}, id: "text-ymez6m1f3", type: "text", x: 830, y: 264, width: 200, height: 60, rotation: 0, draggable: true, selectable: true, … }
  TextRenderer.jsx:234:13
  🔍 Element ID: text-ymez6m1f3 TextRenderer.jsx:235:13
  🔍 Element getProps():
  Object { id: "text-ymez6m1f3", type: "text", x: 830, y: 264, width: 200, height: 60, rotation: 0, draggable: true, selectable: true, deletable: true, … }
  TextRenderer.jsx:236:13
  🔍 Dependency comparison: MemoryEditorPage.jsx:155:15
  ❌ elementsLength CHANGED: MemoryEditorPage.jsx:160:19
  From: 1 MemoryEditorPage.jsx:161:19
  To: 2 MemoryEditorPage.jsx:162:19
  ❌ elementsIds CHANGED: MemoryEditorPage.jsx:160:19
  From: text-q5se784xl MemoryEditorPage.jsx:161:19
  To: text-q5se784xl,text-ymez6m1f3 MemoryEditorPage.jsx:162:19
  ✅ editingManagerType unchanged MemoryEditorPage.jsx:164:19
  ✅ updateElementString unchanged MemoryEditorPage.jsx:164:19
  ✅ elementBehaviorsType unchanged MemoryEditorPage.jsx:164:19
  ✅ setNewSelectedElementString unchanged MemoryEditorPage.jsx:164:19
  🔵 useEffect #6 - Keyboard events fired MemoryEditorPage.jsx:688:13
- selectedElement: text-ymez6m1f3 MemoryEditorPage.jsx:689:13
- editingElement: null MemoryEditorPage.jsx:690:13
  🔍 POSITION CHECK #1 for text text-ymez6m1f3:
  Object { timestamp: "2025-06-18T14:05:06.335Z", currentPosition: {…}, expectedPosition: {…}, positionChanged: false, drift: {…} }
  useElementBehaviors.js:119:17
  🔍 POSITION CHECK #2 for text text-ymez6m1f3:
  Object { timestamp: "2025-06-18T14:05:06.436Z", currentPosition: {…}, expectedPosition: {…}, positionChanged: false, drift: {…} }
  useElementBehaviors.js:119:17
  🔍 POSITION CHECK #3 for text text-ymez6m1f3:
  Object { timestamp: "2025-06-18T14:05:06.537Z", currentPosition: {…}, expectedPosition: {…}, positionChanged: false, drift: {…} }
  useElementBehaviors.js:119:17
  🔍 POSITION CHECK #4 for text text-ymez6m1f3:
  Object { timestamp: "2025-06-18T14:05:06.638Z", currentPosition: {…}, expectedPosition: {…}, positionChanged: false, drift: {…} }
  useElementBehaviors.js:119:17
  🔍 POSITION CHECK #5 for text text-ymez6m1f3:
  Object { timestamp: "2025-06-18T14:05:06.739Z", currentPosition: {…}, expectedPosition: {…}, positionChanged: false, drift: {…} }
  useElementBehaviors.js:119:17
  🔍 POSITION CHECK #6 for text text-ymez6m1f3:
  Object { timestamp: "2025-06-18T14:05:06.840Z", currentPosition: {…}, expectedPosition: {…}, positionChanged: false, drift: {…} }
  useElementBehaviors.js:119:17
  🔍 POSITION CHECK #7 for text text-ymez6m1f3:
  Object { timestamp: "2025-06-18T14:05:06.941Z", currentPosition: {…}, expectedPosition: {…}, positionChanged: false, drift: {…} }
  useElementBehaviors.js:119:17
  🔍 POSITION CHECK #8 for text text-ymez6m1f3:
  Object { timestamp: "2025-06-18T14:05:07.042Z", currentPosition: {…}, expectedPosition: {…}, positionChanged: false, drift: {…} }
  useElementBehaviors.js:119:17
  🔍 POSITION CHECK #9 for text text-ymez6m1f3:
  Object { timestamp: "2025-06-18T14:05:07.142Z", currentPosition: {…}, expectedPosition: {…}, positionChanged: false, drift: {…} }
  useElementBehaviors.js:119:17
  🔍 POSITION CHECK #10 for text text-ymez6m1f3:
  Object { timestamp: "2025-06-18T14:05:07.243Z", currentPosition: {…}, expectedPosition: {…}, positionChanged: false, drift: {…} }
  useElementBehaviors.js:119:17
