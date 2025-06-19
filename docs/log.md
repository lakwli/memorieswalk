Scenario A: create memory, upload photoA, move photoA to left, upload photoB,resize photoB. Result: work perfectly. i can see the movement, i can see the photo is resized on the screen.
🔄 Dasboard Page render method called 3 DashboardPage.jsx:380:13
🔄 Dasboard Page render method called DashboardPage.jsx:380:13
🏠 MemoryEditorPage #14 - Instance: mem-editor-1750331322698 MemoryEditorPage.jsx:81:11
🔍 Upload Manager state:
Object { isUploading: false, uploadStatus: "", currentProgress: 0, currentPhase: "" }
MemoryEditorPage.jsx:211:11
🔵 useEffect #3 - Load memory fired MemoryEditorPage.jsx:287:13
🔵 useEffect #6 - Keyboard events fired MemoryEditorPage.jsx:579:13
🏠 MemoryEditorPage #15 - Instance: mem-editor-1750331322698 MemoryEditorPage.jsx:81:11
🔍 Upload Manager state:
Object { isUploading: false, uploadStatus: "", currentProgress: 0, currentPhase: "" }
MemoryEditorPage.jsx:211:11
🔄 MemoryEditorPage render method called from , Instance: ${instanceId} MemoryEditorPage.jsx:1324:13
Upload Progress:
Object { type: "compression_start", fileName: "canvas.png", fileIndex: 0, totalFiles: 1 }
useUploadManager.js:96:17
🏠 MemoryEditorPage #16 - Instance: mem-editor-1750331322698 MemoryEditorPage.jsx:81:11
🔍 Upload Manager state:
Object { isUploading: true, uploadStatus: "Compressing canvas.png...", currentProgress: 50, currentPhase: "compressing" }
MemoryEditorPage.jsx:211:11
🔄 MemoryEditorPage render method called from , Instance: ${instanceId} MemoryEditorPage.jsx:1324:13
Upload Progress:
Object { type: "compression_end", fileName: "canvas.png", processedFileName: "canvas.webp", originalSize: 803746, processedSize: 100424, fileIndex: 0, totalFiles: 1, wasProcessed: true }
useUploadManager.js:96:17
Upload Progress:
Object { type: "all_files_processed", totalProcessedFiles: 1 }
useUploadManager.js:96:17
Upload Progress:
Object { type: "upload_start", totalFilesToUpload: 1, totalSizeToUpload: 100424 }
useUploadManager.js:96:17
🏠 MemoryEditorPage #17 - Instance: mem-editor-1750331322698 MemoryEditorPage.jsx:81:11
🔍 Upload Manager state:
Object { isUploading: true, uploadStatus: "Uploading (98.07 KB)...", currentProgress: 0, currentPhase: "uploading" }
MemoryEditorPage.jsx:211:11
🔄 MemoryEditorPage render method called from , Instance: ${instanceId} MemoryEditorPage.jsx:1324:13
Upload Progress:
Object { type: "upload_complete", responseData: (1) […], totalFilesUploaded: 1 }
useUploadManager.js:96:17
🏠 MemoryEditorPage #18 - Instance: mem-editor-1750331322698 MemoryEditorPage.jsx:81:11
🔍 Upload Manager state:
Object { isUploading: true, uploadStatus: "Loading images...", currentProgress: 90, currentPhase: "processing" }
MemoryEditorPage.jsx:211:11
🔄 MemoryEditorPage render method called from , Instance: ${instanceId} MemoryEditorPage.jsx:1324:13
🚀 ===== STARTING PHOTO ELEMENT CREATION ===== MemoryEditorPage.jsx:152:15
📱 Screen size detection:
Object { canvasSize: {…}, screenCategory: "xlarge", config: {…} }
photoUtils.js:34:13
🔍 Photo sizing debug:
Object { original: {…}, canvas: {…}, maxCanvas: {…}, config: {…}, smallThreshold: 300 }
photoUtils.js:45:13
📏 Case 2: Large photo constraint photoUtils.js:68:15
🔍 Scaling calculations:
Object { canvasScale: 0.18706256627783668, maxSizeScale: 0.3225806451612903, finalScale: 0.18706256627783668 }
photoUtils.js:79:15
🎯 Final sizing result:
Object { width: 348, height: 176, scale: 0.18706256627783668, reason: "large_photo_constrained_xlarge", screenSizeCategory: "xlarge" }
photoUtils.js:121:13
🏗️ createElement called: useCanvasElements.js:106:13
🏗️ Type: photo useCanvasElements.js:107:13
🏗️ Props:
Object { id: "4470105b-4513-4cf1-a003-a158bd6e42ac", state: "N", image: img, objectURL: "blob:http://localhost:3001/08015990-87e9-4ed8-91e4-b009644b0d9a", originalWidth: 1860, originalHeight: 943, size: 75042, width: 348, height: 176 }
useCanvasElements.js:108:13
🏗️ Created element: 4470105b-4513-4cf1-a003-a158bd6e42ac useCanvasElements.js:111:13
🏗️ createElement completed, returning: 4470105b-4513-4cf1-a003-a158bd6e42ac useCanvasElements.js:130:13
🔄 updateSelectedElement called:
Object { id: "4470105b-4513-4cf1-a003-a158bd6e42ac", type: "photo", x: 756, y: 206, width: 348, height: 176, rotation: 0, draggable: true, selectable: true, deletable: true, … }
useCanvasElements.js:13:13
🏠 MemoryEditorPage #19 - Instance: mem-editor-1750331322698 MemoryEditorPage.jsx:81:11
🏗️ setElements updating: useCanvasElements.js:118:15
🏗️ Previous elements:
Array []
useCanvasElements.js:119:15
🏗️ New elements:
Array [ "4470105b-4513-4cf1-a003-a158bd6e42ac" ]
useCanvasElements.js:123:15
🔄 Different element - updating useCanvasElements.js:22:15
🔍 Upload Manager state:
Object { isUploading: true, uploadStatus: "Upload completed!", currentProgress: 100, currentPhase: "completed" }
MemoryEditorPage.jsx:211:11
🔄 MemoryEditorPage render method called from , Instance: ${instanceId} MemoryEditorPage.jsx:1324:13
🟡 Rendering not found: 4470105b-4513-4cf1-a003-a158bd6e42ac-0 MemoryEditorPage.jsx:1425:35
🟡 Set to Cache: 4470105b-4513-4cf1-a003-a158bd6e42ac-0 MemoryEditorPage.jsx:1433:35
🟡 Total cache: 4470105b-4513-4cf1-a003-a158bd6e42ac-0 MemoryEditorPage.jsx:1445:33
🎯 BaseRenderer rendering: 4470105b-4513-4cf1-a003-a158bd6e42ac BaseRenderer.jsx:113:13
🔵 useEffect #6 - Keyboard events fired MemoryEditorPage.jsx:579:13
🏠 MemoryEditorPage #20 - Instance: mem-editor-1750331322698 MemoryEditorPage.jsx:81:11
🔍 Upload Manager state:
Object { isUploading: false, uploadStatus: "", currentProgress: 0, currentPhase: "" }
MemoryEditorPage.jsx:211:11
🔄 MemoryEditorPage render method called from , Instance: ${instanceId} MemoryEditorPage.jsx:1324:13
🟡 Rendering found: 4470105b-4513-4cf1-a003-a158bd6e42ac-0 MemoryEditorPage.jsx:1435:35
🟡 Total cache: 4470105b-4513-4cf1-a003-a158bd6e42ac-0 MemoryEditorPage.jsx:1445:33
🔶 ===== BaseRenderer handleElementDragStart ===== BaseRenderer.jsx:33:13
🔶 Element ID: 4470105b-4513-4cf1-a003-a158bd6e42ac BaseRenderer.jsx:34:13
🔶 handleElementDragStart completed BaseRenderer.jsx:40:13
🔶 ===== BaseRenderer handleElementDragEnd ===== BaseRenderer.jsx:43:13
🔶 Element ID: 4470105b-4513-4cf1-a003-a158bd6e42ac BaseRenderer.jsx:44:13
🔶 Position change:
Object { from: {…}, to: {…} }
BaseRenderer.jsx:51:13
🔶 About to call onUpdate... BaseRenderer.jsx:63:13
🔄 updateElement called:
Object { elementId: "4470105b-4513-4cf1-a003-a158bd6e42ac", updates: {…} }
useCanvasElements.js:29:15
🔄 setElements prev state: 1 elements useCanvasElements.js:32:17
🔄 Updating element: 4470105b-4513-4cf1-a003-a158bd6e42ac with:
Object { x: 223, y: 198 }
useCanvasElements.js:40:17
🔄 Element BEFORE Object.assign:
Object { id: "4470105b-4513-4cf1-a003-a158bd6e42ac", type: "photo", x: 223, y: 198, width: 348, height: 176, rotation: 0, draggable: true, selectable: true, deletable: true, … }
useCanvasElements.js:41:17
🔄 Element AFTER Object.assign:
Object { id: "4470105b-4513-4cf1-a003-a158bd6e42ac", type: "photo", x: 223, y: 198, width: 348, height: 176, rotation: 0, draggable: true, selectable: true, deletable: true, … }
useCanvasElements.js:45:17
🔄 Selection check:
Object { elementId: "4470105b-4513-4cf1-a003-a158bd6e42ac", selectedElementId: "4470105b-4513-4cf1-a003-a158bd6e42ac", selectedElement: {…}, isMatch: true }
useCanvasElements.js:48:17
🔄 Updated element is selected - updating selection reference useCanvasElements.js:56:19
🔄 updateSelectedElement called:
Object { id: "4470105b-4513-4cf1-a003-a158bd6e42ac", type: "photo", x: 223, y: 198, width: 348, height: 176, rotation: 0, draggable: true, selectable: true, deletable: true, … }
useCanvasElements.js:13:13
🔄 Different element - updating useCanvasElements.js:22:15
🔶 onUpdate called BaseRenderer.jsx:70:13
🔶 handleElementDragEnd completed BaseRenderer.jsx:71:13
🟡 Ignoring non-stage drag event MemoryEditorPage.jsx:1405:33
🏠 MemoryEditorPage #21 - Instance: mem-editor-1750331322698 MemoryEditorPage.jsx:81:11
🔍 Upload Manager state:
Object { isUploading: false, uploadStatus: "", currentProgress: 0, currentPhase: "" }
MemoryEditorPage.jsx:211:11
🔄 MemoryEditorPage render method called from , Instance: ${instanceId} MemoryEditorPage.jsx:1324:13
🟡 Rendering not found: 4470105b-4513-4cf1-a003-a158bd6e42ac-1 MemoryEditorPage.jsx:1425:35
🟡 Set to Cache: 4470105b-4513-4cf1-a003-a158bd6e42ac-1 MemoryEditorPage.jsx:1433:35
🟡 Total cache: 4470105b-4513-4cf1-a003-a158bd6e42ac-0,4470105b-4513-4cf1-a003-a158bd6e42ac-1 MemoryEditorPage.jsx:1445:33
🧹 Cleaning up old renderer: 4470105b-4513-4cf1-a003-a158bd6e42ac-0 MemoryEditorPage.jsx:1449:39
🎯 BaseRenderer rendering: 4470105b-4513-4cf1-a003-a158bd6e42ac BaseRenderer.jsx:113:13
🔵 useEffect #6 - Keyboard events fired MemoryEditorPage.jsx:579:13
Upload Progress:
Object { type: "compression_start", fileName: "file_example_PNG_1MB.png", fileIndex: 0, totalFiles: 1 }
useUploadManager.js:96:17
🏠 MemoryEditorPage #22 - Instance: mem-editor-1750331322698 MemoryEditorPage.jsx:81:11
🔍 Upload Manager state:
Object { isUploading: true, uploadStatus: "Compressing file_example_PNG_1MB.png...", currentProgress: 50, currentPhase: "compressing" }
MemoryEditorPage.jsx:211:11
🔄 MemoryEditorPage render method called from , Instance: ${instanceId} MemoryEditorPage.jsx:1324:13
🟡 Rendering found: 4470105b-4513-4cf1-a003-a158bd6e42ac-1 MemoryEditorPage.jsx:1435:35
🟡 Total cache: 4470105b-4513-4cf1-a003-a158bd6e42ac-1 MemoryEditorPage.jsx:1445:33
Upload Progress:
Object { type: "compression_end", fileName: "file_example_PNG_1MB.png", processedFileName: "file_example_PNG_1MB.webp", originalSize: 1006708, processedSize: 60002, fileIndex: 0, totalFiles: 1, wasProcessed: true }
useUploadManager.js:96:17
Upload Progress:
Object { type: "all_files_processed", totalProcessedFiles: 1 }
useUploadManager.js:96:17
Upload Progress:
Object { type: "upload_start", totalFilesToUpload: 1, totalSizeToUpload: 60002 }
useUploadManager.js:96:17
🏠 MemoryEditorPage #23 - Instance: mem-editor-1750331322698 MemoryEditorPage.jsx:81:11
🔍 Upload Manager state:
Object { isUploading: true, uploadStatus: "Uploading (58.6 KB)...", currentProgress: 0, currentPhase: "uploading" }
MemoryEditorPage.jsx:211:11
🔄 MemoryEditorPage render method called from , Instance: ${instanceId} MemoryEditorPage.jsx:1324:13
🟡 Rendering found: 4470105b-4513-4cf1-a003-a158bd6e42ac-1 MemoryEditorPage.jsx:1435:35
🟡 Total cache: 4470105b-4513-4cf1-a003-a158bd6e42ac-1 MemoryEditorPage.jsx:1445:33
Upload Progress:
Object { type: "upload_complete", responseData: (1) […], totalFilesUploaded: 1 }
useUploadManager.js:96:17
🏠 MemoryEditorPage #24 - Instance: mem-editor-1750331322698 MemoryEditorPage.jsx:81:11
🔍 Upload Manager state:
Object { isUploading: true, uploadStatus: "Loading images...", currentProgress: 90, currentPhase: "processing" }
MemoryEditorPage.jsx:211:11
🔄 MemoryEditorPage render method called from , Instance: ${instanceId} MemoryEditorPage.jsx:1324:13
🟡 Rendering found: 4470105b-4513-4cf1-a003-a158bd6e42ac-1 MemoryEditorPage.jsx:1435:35
🟡 Total cache: 4470105b-4513-4cf1-a003-a158bd6e42ac-1 MemoryEditorPage.jsx:1445:33
🚀 ===== STARTING PHOTO ELEMENT CREATION ===== MemoryEditorPage.jsx:152:15
📱 Screen size detection:
Object { canvasSize: {…}, screenCategory: "xlarge", config: {…} }
photoUtils.js:34:13
🔍 Photo sizing debug:
Object { original: {…}, canvas: {…}, maxCanvas: {…}, config: {…}, smallThreshold: 300 }
photoUtils.js:45:13
📏 Case 2: Large photo constraint photoUtils.js:68:15
🔍 Scaling calculations:
Object { canvasScale: 0.21176470588235294, maxSizeScale: 0.48, finalScale: 0.21176470588235294 }
photoUtils.js:79:15
🎯 Final sizing result:
Object { width: 265, height: 176, scale: 0.21176470588235294, reason: "large_photo_constrained_xlarge", screenSizeCategory: "xlarge" }
photoUtils.js:121:13
🏗️ createElement called: useCanvasElements.js:106:13
🏗️ Type: photo useCanvasElements.js:107:13
🏗️ Props:
Object { id: "7830ec42-546e-45de-9fa0-6abd20db419d", state: "N", image: img, objectURL: "blob:http://localhost:3001/6c6d0b17-09b1-4b59-91a5-ed1ffcf5d479", originalWidth: 1250, originalHeight: 833, size: 35172, width: 265, height: 176 }
useCanvasElements.js:108:13
🏗️ Created element: 7830ec42-546e-45de-9fa0-6abd20db419d useCanvasElements.js:111:13
🏗️ createElement completed, returning: 7830ec42-546e-45de-9fa0-6abd20db419d useCanvasElements.js:130:13
🔄 updateSelectedElement called:
Object { id: "7830ec42-546e-45de-9fa0-6abd20db419d", type: "photo", x: 797.5, y: 206, width: 265, height: 176, rotation: 0, draggable: true, selectable: true, deletable: true, … }
useCanvasElements.js:13:13
🏠 MemoryEditorPage #25 - Instance: mem-editor-1750331322698 MemoryEditorPage.jsx:81:11
🏗️ setElements updating: useCanvasElements.js:118:15
🏗️ Previous elements:
Array [ "4470105b-4513-4cf1-a003-a158bd6e42ac" ]
useCanvasElements.js:119:15
🏗️ New elements:
Array [ "4470105b-4513-4cf1-a003-a158bd6e42ac", "7830ec42-546e-45de-9fa0-6abd20db419d" ]
useCanvasElements.js:123:15
🔄 Different element - updating useCanvasElements.js:22:15
🔍 Upload Manager state:
Object { isUploading: true, uploadStatus: "Upload completed!", currentProgress: 100, currentPhase: "completed" }
MemoryEditorPage.jsx:211:11
🔄 MemoryEditorPage render method called from , Instance: ${instanceId} MemoryEditorPage.jsx:1324:13
🟡 Rendering found: 4470105b-4513-4cf1-a003-a158bd6e42ac-1 MemoryEditorPage.jsx:1435:35
🟡 Total cache: 4470105b-4513-4cf1-a003-a158bd6e42ac-1 MemoryEditorPage.jsx:1445:33
🟡 Rendering not found: 7830ec42-546e-45de-9fa0-6abd20db419d-0 MemoryEditorPage.jsx:1425:35
🟡 Set to Cache: 7830ec42-546e-45de-9fa0-6abd20db419d-0 MemoryEditorPage.jsx:1433:35
🟡 Total cache: 7830ec42-546e-45de-9fa0-6abd20db419d-0 MemoryEditorPage.jsx:1445:33
🎯 BaseRenderer rendering: 7830ec42-546e-45de-9fa0-6abd20db419d BaseRenderer.jsx:113:13
🔵 useEffect #6 - Keyboard events fired MemoryEditorPage.jsx:579:13
🏠 MemoryEditorPage #26 - Instance: mem-editor-1750331322698 MemoryEditorPage.jsx:81:11
🔍 Upload Manager state:
Object { isUploading: false, uploadStatus: "", currentProgress: 0, currentPhase: "" }
MemoryEditorPage.jsx:211:11
🔄 MemoryEditorPage render method called from , Instance: ${instanceId} MemoryEditorPage.jsx:1324:13
🟡 Rendering found: 4470105b-4513-4cf1-a003-a158bd6e42ac-1 MemoryEditorPage.jsx:1435:35
🟡 Total cache: 4470105b-4513-4cf1-a003-a158bd6e42ac-1 MemoryEditorPage.jsx:1445:33
🟡 Rendering found: 7830ec42-546e-45de-9fa0-6abd20db419d-0 MemoryEditorPage.jsx:1435:35
🟡 Total cache: 7830ec42-546e-45de-9fa0-6abd20db419d-0 MemoryEditorPage.jsx:1445:33
🔶 BaseRenderer handleElementTransform BaseRenderer.jsx:78:13
🔶 Transform updates:
Object { x: 797.5000000000005, y: 206, rotation: 0, width: 567, height: 376 }
BaseRenderer.jsx:92:13
🔄 updateElement called:
Object { elementId: "7830ec42-546e-45de-9fa0-6abd20db419d", updates: {…} }
useCanvasElements.js:29:15
🔄 setElements prev state: 2 elements useCanvasElements.js:32:17
🔄 Updating element: 7830ec42-546e-45de-9fa0-6abd20db419d with:
Object { x: 797.5000000000005, y: 206, rotation: 0, width: 567, height: 376 }
useCanvasElements.js:40:17
🔄 Element BEFORE Object.assign:
Object { id: "7830ec42-546e-45de-9fa0-6abd20db419d", type: "photo", x: 797.5, y: 206, width: 265, height: 176, rotation: 0, draggable: true, selectable: true, deletable: true, … }
useCanvasElements.js:41:17
🔄 Element AFTER Object.assign:
Object { id: "7830ec42-546e-45de-9fa0-6abd20db419d", type: "photo", x: 797.5000000000005, y: 206, width: 567, height: 376, rotation: 0, draggable: true, selectable: true, deletable: true, … }
useCanvasElements.js:45:17
🔄 Selection check:
Object { elementId: "7830ec42-546e-45de-9fa0-6abd20db419d", selectedElementId: "7830ec42-546e-45de-9fa0-6abd20db419d", selectedElement: {…}, isMatch: true }
useCanvasElements.js:48:17
🔄 Updated element is selected - updating selection reference useCanvasElements.js:56:19
🔄 updateSelectedElement called:
Object { id: "7830ec42-546e-45de-9fa0-6abd20db419d", type: "photo", x: 797.5000000000005, y: 206, width: 567, height: 376, rotation: 0, draggable: true, selectable: true, deletable: true, … }
useCanvasElements.js:13:13
🔄 Different element - updating useCanvasElements.js:22:15
🏠 MemoryEditorPage #27 - Instance: mem-editor-1750331322698 MemoryEditorPage.jsx:81:11
🔍 Upload Manager state:
Object { isUploading: false, uploadStatus: "", currentProgress: 0, currentPhase: "" }
MemoryEditorPage.jsx:211:11
🔄 MemoryEditorPage render method called from , Instance: ${instanceId} MemoryEditorPage.jsx:1324:13
🟡 Rendering found: 4470105b-4513-4cf1-a003-a158bd6e42ac-1 MemoryEditorPage.jsx:1435:35
🟡 Total cache: 4470105b-4513-4cf1-a003-a158bd6e42ac-1 MemoryEditorPage.jsx:1445:33
🟡 Rendering not found: 7830ec42-546e-45de-9fa0-6abd20db419d-1 MemoryEditorPage.jsx:1425:35
🟡 Set to Cache: 7830ec42-546e-45de-9fa0-6abd20db419d-1 MemoryEditorPage.jsx:1433:35
🟡 Total cache: 7830ec42-546e-45de-9fa0-6abd20db419d-0,7830ec42-546e-45de-9fa0-6abd20db419d-1 MemoryEditorPage.jsx:1445:33
🧹 Cleaning up old renderer: 7830ec42-546e-45de-9fa0-6abd20db419d-0 MemoryEditorPage.jsx:1449:39
🎯 BaseRenderer rendering: 7830ec42-546e-45de-9fa0-6abd20db419d BaseRenderer.jsx:113:13
🔵 useEffect #6 - Keyboard events fired MemoryEditorPage.jsx:579:13
🔍 handleStageClick called - determining what was clicked MemoryEditorPage.jsx:253:15
🔍 Selection changing:
Object { from: "7830ec42-546e-45de-9fa0-6abd20db419d", to: "4470105b-4513-4cf1-a003-a158bd6e42ac" }
MemoryEditorPage.jsx:237:15
🔄 updateSelectedElement called:
Object { id: "4470105b-4513-4cf1-a003-a158bd6e42ac", type: "photo", x: 223, y: 198, width: 348, height: 176, rotation: 0, draggable: true, selectable: true, deletable: true, … }
useCanvasElements.js:13:13
🔄 Different element - updating useCanvasElements.js:22:15
🏠 MemoryEditorPage #28 - Instance: mem-editor-1750331322698 MemoryEditorPage.jsx:81:11
🔍 Upload Manager state:
Object { isUploading: false, uploadStatus: "", currentProgress: 0, currentPhase: "" }
MemoryEditorPage.jsx:211:11
🔄 MemoryEditorPage render method called from , Instance: ${instanceId} MemoryEditorPage.jsx:1324:13
🟡 Rendering found: 4470105b-4513-4cf1-a003-a158bd6e42ac-1 MemoryEditorPage.jsx:1435:35
🟡 Total cache: 4470105b-4513-4cf1-a003-a158bd6e42ac-1 MemoryEditorPage.jsx:1445:33
🟡 Rendering found: 7830ec42-546e-45de-9fa0-6abd20db419d-1 MemoryEditorPage.jsx:1435:35
🟡 Total cache: 7830ec42-546e-45de-9fa0-6abd20db419d-1 MemoryEditorPage.jsx:1445:33
🔵 useEffect #6 - Keyboard events fired MemoryEditorPage.jsx:579:13
🔶 BaseRenderer handleElementTransform BaseRenderer.jsx:78:13
🔶 Transform updates:
Object { x: 223.00000000000006, y: 119.63869426372024, rotation: 0, width: 503, height: 254 }
BaseRenderer.jsx:92:13
🔄 updateElement called:
Object { elementId: "4470105b-4513-4cf1-a003-a158bd6e42ac", updates: {…} }
useCanvasElements.js:29:15
🔄 setElements prev state: 2 elements useCanvasElements.js:32:17
🔄 Updating element: 4470105b-4513-4cf1-a003-a158bd6e42ac with:
Object { x: 223.00000000000006, y: 119.63869426372024, rotation: 0, width: 503, height: 254 }
useCanvasElements.js:40:17
🔄 Element BEFORE Object.assign:
Object { id: "4470105b-4513-4cf1-a003-a158bd6e42ac", type: "photo", x: 223, y: 198, width: 348, height: 176, rotation: 0, draggable: true, selectable: true, deletable: true, … }
useCanvasElements.js:41:17
🔄 Element AFTER Object.assign:
Object { id: "4470105b-4513-4cf1-a003-a158bd6e42ac", type: "photo", x: 223.00000000000006, y: 119.63869426372024, width: 503, height: 254, rotation: 0, draggable: true, selectable: true, deletable: true, … }
useCanvasElements.js:45:17
🔄 Selection check:
Object { elementId: "4470105b-4513-4cf1-a003-a158bd6e42ac", selectedElementId: "4470105b-4513-4cf1-a003-a158bd6e42ac", selectedElement: {…}, isMatch: true }
useCanvasElements.js:48:17
🔄 Updated element is selected - updating selection reference useCanvasElements.js:56:19
🔄 updateSelectedElement called:
Object { id: "4470105b-4513-4cf1-a003-a158bd6e42ac", type: "photo", x: 223.00000000000006, y: 119.63869426372024, width: 503, height: 254, rotation: 0, draggable: true, selectable: true, deletable: true, … }
useCanvasElements.js:13:13
🔄 Different element - updating useCanvasElements.js:22:15
🏠 MemoryEditorPage #29 - Instance: mem-editor-1750331322698 MemoryEditorPage.jsx:81:11
🔍 Upload Manager state:
Object { isUploading: false, uploadStatus: "", currentProgress: 0, currentPhase: "" }
MemoryEditorPage.jsx:211:11
🔄 MemoryEditorPage render method called from , Instance: ${instanceId} MemoryEditorPage.jsx:1324:13
🟡 Rendering not found: 4470105b-4513-4cf1-a003-a158bd6e42ac-2 MemoryEditorPage.jsx:1425:35
🟡 Set to Cache: 4470105b-4513-4cf1-a003-a158bd6e42ac-2 MemoryEditorPage.jsx:1433:35
🟡 Total cache: 4470105b-4513-4cf1-a003-a158bd6e42ac-1,4470105b-4513-4cf1-a003-a158bd6e42ac-2 MemoryEditorPage.jsx:1445:33
🧹 Cleaning up old renderer: 4470105b-4513-4cf1-a003-a158bd6e42ac-1 MemoryEditorPage.jsx:1449:39
🟡 Rendering found: 7830ec42-546e-45de-9fa0-6abd20db419d-1 MemoryEditorPage.jsx:1435:35
🟡 Total cache: 7830ec42-546e-45de-9fa0-6abd20db419d-1 MemoryEditorPage.jsx:1445:33
🎯 BaseRenderer rendering: 4470105b-4513-4cf1-a003-a158bd6e42ac BaseRenderer.jsx:113:13
🔵 useEffect #6 - Keyboard events fired MemoryEditorPage.jsx:579:13

Scenario B:
load existing memory. there are 2 pictures. photoC and photo D. resize photoD, the photoD revert back to original size on screen. Clicked on photoC, now photoD show the resized. Resize photoC, photoC revert back to its origrinal size on the UI. Clicked on photo D, now the photoC reflect to it's resized on the screen:
🔄 Dasboard Page render method called DashboardPage.jsx:380:13
🏠 MemoryEditorPage #63 - Instance: mem-editor-1750331465779 MemoryEditorPage.jsx:81:11
🔍 Upload Manager state:
Object { isUploading: false, uploadStatus: "", currentProgress: 0, currentPhase: "" }
MemoryEditorPage.jsx:211:11
🔵 useEffect #3 - Load memory fired MemoryEditorPage.jsx:287:13
🔵 useEffect #6 - Keyboard events fired MemoryEditorPage.jsx:579:13
🏠 MemoryEditorPage #64 - Instance: mem-editor-1750331465779 MemoryEditorPage.jsx:81:11
🔍 Upload Manager state:
Object { isUploading: false, uploadStatus: "", currentProgress: 0, currentPhase: "" }
MemoryEditorPage.jsx:211:11
🏠 MemoryEditorPage #65 - Instance: mem-editor-1750331465779 MemoryEditorPage.jsx:81:11
🔍 Upload Manager state:
Object { isUploading: false, uploadStatus: "", currentProgress: 0, currentPhase: "" }
MemoryEditorPage.jsx:211:11
🔄 MemoryEditorPage render method called from , Instance: ${instanceId} MemoryEditorPage.jsx:1324:13
🟡 Rendering not found: cdb45097-1e47-4766-abe7-740a1a348081-0 MemoryEditorPage.jsx:1425:35
🟡 Set to Cache: cdb45097-1e47-4766-abe7-740a1a348081-0 MemoryEditorPage.jsx:1433:35
🟡 Total cache: cdb45097-1e47-4766-abe7-740a1a348081-0 MemoryEditorPage.jsx:1445:33
🟡 Rendering not found: 942aaa9a-ae8a-4561-b993-c1c198e1ef59-0 MemoryEditorPage.jsx:1425:35
🟡 Set to Cache: 942aaa9a-ae8a-4561-b993-c1c198e1ef59-0 MemoryEditorPage.jsx:1433:35
🟡 Total cache: 942aaa9a-ae8a-4561-b993-c1c198e1ef59-0 MemoryEditorPage.jsx:1445:33
🎯 BaseRenderer rendering: cdb45097-1e47-4766-abe7-740a1a348081 BaseRenderer.jsx:113:13
🎯 BaseRenderer rendering: 942aaa9a-ae8a-4561-b993-c1c198e1ef59 BaseRenderer.jsx:113:13
🔍 handleStageClick called - determining what was clicked MemoryEditorPage.jsx:253:15
🔍 Selection changing:
Object { from: null, to: "942aaa9a-ae8a-4561-b993-c1c198e1ef59" }
MemoryEditorPage.jsx:237:15
🔄 updateSelectedElement called:
Object { id: "942aaa9a-ae8a-4561-b993-c1c198e1ef59", type: "photo", x: 869.6856435978402, y: 74.43407819598866, width: 479, height: 237, rotation: 48.64033897665059, draggable: true, selectable: true, deletable: true, … }
useCanvasElements.js:13:13
🔄 Different element - updating useCanvasElements.js:22:15
🏠 MemoryEditorPage #66 - Instance: mem-editor-1750331465779 MemoryEditorPage.jsx:81:11
🔍 Upload Manager state:
Object { isUploading: false, uploadStatus: "", currentProgress: 0, currentPhase: "" }
MemoryEditorPage.jsx:211:11
🔄 MemoryEditorPage render method called from , Instance: ${instanceId} MemoryEditorPage.jsx:1324:13
🟡 Rendering found: cdb45097-1e47-4766-abe7-740a1a348081-0 MemoryEditorPage.jsx:1435:35
🟡 Total cache: cdb45097-1e47-4766-abe7-740a1a348081-0 MemoryEditorPage.jsx:1445:33
🟡 Rendering found: 942aaa9a-ae8a-4561-b993-c1c198e1ef59-0 MemoryEditorPage.jsx:1435:35
🟡 Total cache: 942aaa9a-ae8a-4561-b993-c1c198e1ef59-0 MemoryEditorPage.jsx:1445:33
🔵 useEffect #6 - Keyboard events fired MemoryEditorPage.jsx:579:13
🔶 BaseRenderer handleElementTransform BaseRenderer.jsx:78:13
🔶 Transform updates:
Object { x: 1007.2538590289405, y: -46.676589990287745, rotation: 48.640338976650554, width: 479, height: 420 }
BaseRenderer.jsx:92:13
🔄 updateElement called:
Object { elementId: "942aaa9a-ae8a-4561-b993-c1c198e1ef59", updates: {…} }
useCanvasElements.js:29:15
🔄 setElements prev state: 2 elements useCanvasElements.js:32:17
🔄 Updating element: 942aaa9a-ae8a-4561-b993-c1c198e1ef59 with:
Object { x: 1007.2538590289405, y: -46.676589990287745, rotation: 48.640338976650554, width: 479, height: 420 }
useCanvasElements.js:40:17
🔄 Element BEFORE Object.assign:
Object { id: "942aaa9a-ae8a-4561-b993-c1c198e1ef59", type: "photo", x: 869.6856435978402, y: 74.43407819598866, width: 479, height: 237, rotation: 48.64033897665059, draggable: true, selectable: true, deletable: true, … }
useCanvasElements.js:41:17
🔄 Element AFTER Object.assign:
Object { id: "942aaa9a-ae8a-4561-b993-c1c198e1ef59", type: "photo", x: 1007.2538590289405, y: -46.676589990287745, width: 479, height: 420, rotation: 48.640338976650554, draggable: true, selectable: true, deletable: true, … }
useCanvasElements.js:45:17
🔄 Selection check:
Object { elementId: "942aaa9a-ae8a-4561-b993-c1c198e1ef59", selectedElementId: undefined, selectedElement: null, isMatch: false }
useCanvasElements.js:48:17
🔄 Updated element is NOT selected - no toolbar update useCanvasElements.js:61:19
🔍 handleStageClick called - determining what was clicked MemoryEditorPage.jsx:253:15
🔍 Selection changing:
Object { from: "942aaa9a-ae8a-4561-b993-c1c198e1ef59", to: "cdb45097-1e47-4766-abe7-740a1a348081" }
MemoryEditorPage.jsx:237:15
🔄 updateSelectedElement called:
Object { id: "cdb45097-1e47-4766-abe7-740a1a348081", type: "photo", x: 56.74435700925396, y: 286.39123400815083, width: 293, height: 440, rotation: -40.39551284301785, draggable: true, selectable: true, deletable: true, … }
useCanvasElements.js:13:13
🔄 Different element - updating useCanvasElements.js:22:15
🏠 MemoryEditorPage #67 - Instance: mem-editor-1750331465779 MemoryEditorPage.jsx:81:11
🔍 Upload Manager state:
Object { isUploading: false, uploadStatus: "", currentProgress: 0, currentPhase: "" }
MemoryEditorPage.jsx:211:11
🔄 MemoryEditorPage render method called from , Instance: ${instanceId} MemoryEditorPage.jsx:1324:13
🟡 Rendering found: cdb45097-1e47-4766-abe7-740a1a348081-0 MemoryEditorPage.jsx:1435:35
🟡 Total cache: cdb45097-1e47-4766-abe7-740a1a348081-0 MemoryEditorPage.jsx:1445:33
🟡 Rendering not found: 942aaa9a-ae8a-4561-b993-c1c198e1ef59-1 MemoryEditorPage.jsx:1425:35
🟡 Set to Cache: 942aaa9a-ae8a-4561-b993-c1c198e1ef59-1 MemoryEditorPage.jsx:1433:35
🟡 Total cache: 942aaa9a-ae8a-4561-b993-c1c198e1ef59-0,942aaa9a-ae8a-4561-b993-c1c198e1ef59-1 MemoryEditorPage.jsx:1445:33
🧹 Cleaning up old renderer: 942aaa9a-ae8a-4561-b993-c1c198e1ef59-0 MemoryEditorPage.jsx:1449:39
🎯 BaseRenderer rendering: 942aaa9a-ae8a-4561-b993-c1c198e1ef59 BaseRenderer.jsx:113:13
🔵 useEffect #6 - Keyboard events fired MemoryEditorPage.jsx:579:13
🔶 BaseRenderer handleElementTransform BaseRenderer.jsx:78:13
🔶 Transform updates:
Object { x: 56.74435700925375, y: 286.39123400815106, rotation: -40.395512843017876, width: 433, height: 440 }
BaseRenderer.jsx:92:13
🔄 updateElement called:
Object { elementId: "cdb45097-1e47-4766-abe7-740a1a348081", updates: {…} }
useCanvasElements.js:29:15
🔄 setElements prev state: 2 elements useCanvasElements.js:32:17
🔄 Updating element: cdb45097-1e47-4766-abe7-740a1a348081 with:
Object { x: 56.74435700925375, y: 286.39123400815106, rotation: -40.395512843017876, width: 433, height: 440 }
useCanvasElements.js:40:17
🔄 Element BEFORE Object.assign:
Object { id: "cdb45097-1e47-4766-abe7-740a1a348081", type: "photo", x: 56.74435700925396, y: 286.39123400815083, width: 293, height: 440, rotation: -40.39551284301785, draggable: true, selectable: true, deletable: true, … }
useCanvasElements.js:41:17
🔄 Element AFTER Object.assign:
Object { id: "cdb45097-1e47-4766-abe7-740a1a348081", type: "photo", x: 56.74435700925375, y: 286.39123400815106, width: 433, height: 440, rotation: -40.395512843017876, draggable: true, selectable: true, deletable: true, … }
useCanvasElements.js:45:17
🔄 Selection check:
Object { elementId: "cdb45097-1e47-4766-abe7-740a1a348081", selectedElementId: undefined, selectedElement: null, isMatch: false }
useCanvasElements.js:48:17
🔄 Updated element is NOT selected - no toolbar update useCanvasElements.js:61:19
🔍 handleStageClick called - determining what was clicked MemoryEditorPage.jsx:253:15
🔍 Selection changing:
Object { from: "cdb45097-1e47-4766-abe7-740a1a348081", to: "942aaa9a-ae8a-4561-b993-c1c198e1ef59" }
MemoryEditorPage.jsx:237:15
🔄 updateSelectedElement called:
Object { id: "942aaa9a-ae8a-4561-b993-c1c198e1ef59", type: "photo", x: 1007.2538590289405, y: -46.676589990287745, width: 479, height: 420, rotation: 48.640338976650554, draggable: true, selectable: true, deletable: true, … }
useCanvasElements.js:13:13
🔄 Different element - updating useCanvasElements.js:22:15
🏠 MemoryEditorPage #68 - Instance: mem-editor-1750331465779 MemoryEditorPage.jsx:81:11
🔍 Upload Manager state:
Object { isUploading: false, uploadStatus: "", currentProgress: 0, currentPhase: "" }
MemoryEditorPage.jsx:211:11
🔄 MemoryEditorPage render method called from , Instance: ${instanceId} MemoryEditorPage.jsx:1324:13
🟡 Rendering not found: cdb45097-1e47-4766-abe7-740a1a348081-1 MemoryEditorPage.jsx:1425:35
🟡 Set to Cache: cdb45097-1e47-4766-abe7-740a1a348081-1 MemoryEditorPage.jsx:1433:35
🟡 Total cache: cdb45097-1e47-4766-abe7-740a1a348081-0,cdb45097-1e47-4766-abe7-740a1a348081-1 MemoryEditorPage.jsx:1445:33
🧹 Cleaning up old renderer: cdb45097-1e47-4766-abe7-740a1a348081-0 MemoryEditorPage.jsx:1449:39
🟡 Rendering found: 942aaa9a-ae8a-4561-b993-c1c198e1ef59-1 MemoryEditorPage.jsx:1435:35
🟡 Total cache: 942aaa9a-ae8a-4561-b993-c1c198e1ef59-1 MemoryEditorPage.jsx:1445:33
🎯 BaseRenderer rendering: cdb45097-1e47-4766-abe7-740a1a348081 BaseRenderer.jsx:113:13
🔵 useEffect #6 - Keyboard events fired MemoryEditorPage.jsx:579:13
