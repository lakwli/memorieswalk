Upload Progress:
Object { type: "compression_start", fileName: "canvas.png", fileIndex: 0, totalFiles: 1 }
useUploadManager.js:96:17
🏠 MemoryEditorPage #228 - Instance: mem-editor-1750417056591 MemoryEditorPage.jsx:80:11
🔍 Upload Manager state:
Object { isUploading: true, uploadStatus: "Compressing canvas.png...", currentProgress: 50, currentPhase: "compressing" }
MemoryEditorPage.jsx:150:11
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
🏠 MemoryEditorPage #229 - Instance: mem-editor-1750417056591 MemoryEditorPage.jsx:80:11
🔍 Upload Manager state:
Object { isUploading: true, uploadStatus: "Uploading (98.07 KB)...", currentProgress: 0, currentPhase: "uploading" }
MemoryEditorPage.jsx:150:11
🔄 MemoryEditorPage render method called from , Instance: ${instanceId} MemoryEditorPage.jsx:1324:13
Upload Progress:
Object { type: "upload_complete", responseData: (1) […], totalFilesUploaded: 1 }
useUploadManager.js:96:17
🏠 MemoryEditorPage #230 - Instance: mem-editor-1750417056591 MemoryEditorPage.jsx:80:11
🔍 Upload Manager state:
Object { isUploading: true, uploadStatus: "Loading images...", currentProgress: 90, currentPhase: "processing" }
MemoryEditorPage.jsx:150:11
🔄 MemoryEditorPage render method called from , Instance: ${instanceId} MemoryEditorPage.jsx:1324:13
🚀 ===== STARTING PHOTO ELEMENT CREATION ===== MemoryEditorPage.jsx:418:15
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
🏗️ createElement called: useCanvasElements.js:99:13
🏗️ Type: photo useCanvasElements.js:100:13
🏗️ Props:
Object { id: "49de3704-7236-4606-9c0e-da0c1c6616be", state: "N", image: img, objectURL: "blob:http://localhost:3001/f4fc5245-f357-47da-8b0b-22b3041e1857", originalWidth: 1860, originalHeight: 943, size: 75042, width: 348, height: 176 }
useCanvasElements.js:101:13
🏗️ Created element: 49de3704-7236-4606-9c0e-da0c1c6616be useCanvasElements.js:104:13
🏗️ createElement completed, returning: 49de3704-7236-4606-9c0e-da0c1c6616be useCanvasElements.js:123:13
🔄 updateSelectedElement called:
Object { id: "49de3704-7236-4606-9c0e-da0c1c6616be", type: "photo", x: 756, y: 206, width: 348, height: 176, rotation: 0, draggable: true, selectable: true, deletable: true, … }
useCanvasElements.js:13:13
🏠 MemoryEditorPage #231 - Instance: mem-editor-1750417056591 MemoryEditorPage.jsx:80:11
🏗️ setElements updating: useCanvasElements.js:111:15
🏗️ Previous elements:
Array []
useCanvasElements.js:112:15
🏗️ New elements:
Array [ "49de3704-7236-4606-9c0e-da0c1c6616be" ]
useCanvasElements.js:116:15
🔄 Different element - updating useCanvasElements.js:22:15
🔍 Upload Manager state:
Object { isUploading: true, uploadStatus: "Upload completed!", currentProgress: 100, currentPhase: "completed" }
MemoryEditorPage.jsx:150:11
🔄 MemoryEditorPage render method called from , Instance: ${instanceId} MemoryEditorPage.jsx:1324:13
🟡 Rendering not found: 49de3704-7236-4606-9c0e-da0c1c6616be-0 MemoryEditorPage.jsx:1413:35
🟡 Set to Cache: 49de3704-7236-4606-9c0e-da0c1c6616be-0 MemoryEditorPage.jsx:1421:35
🟡 Total cache: 49de3704-7236-4606-9c0e-da0c1c6616be-0 MemoryEditorPage.jsx:1433:33
🎯 getToolbarPosition called - element dimensions:
Object { width: 348, height: 176, x: 756, y: 206 }
ElementToolbar.jsx:56:15
🎯 Using fallback position calculation: ElementToolbar.jsx:81:17
🎯 Stage container rect:
DOMRect { x: 60, y: 60, width: 1860, height: 588, top: 60, right: 1920, bottom: 648, left: 60 }
ElementToolbar.jsx:82:17
🎯 Stage scale: 1 ElementToolbar.jsx:83:17
🎯 Stage position:
Object { x: 0, y: 0 }
ElementToolbar.jsx:84:17
🎯 Element logical position:
Object { x: 756, y: 206 }
ElementToolbar.jsx:85:17
🎯 Calculated screen position:
Object { x: 816, y: 266 }
ElementToolbar.jsx:89:17
🎯 Toolbar will render at position:
Object { top: 146, left: 816 }
ElementToolbar.jsx:147:13
🎯 ===== ElementToolbar RENDER END ===== ElementToolbar.jsx:148:13
🔄 ElementToolar render: Element W=348 H=176, Position: (756, 206), Mode: select, Controls: 6 ElementToolbar.jsx:165:15
🎯 BaseRenderer rendering: 49de3704-7236-4606-9c0e-da0c1c6616be BaseRenderer.jsx:113:13
🔵 useEffect #6 - Keyboard events fired MemoryEditorPage.jsx:579:13
🏠 MemoryEditorPage #232 - Instance: mem-editor-1750417056591 MemoryEditorPage.jsx:80:11
🔍 Upload Manager state:
Object { isUploading: false, uploadStatus: "", currentProgress: 0, currentPhase: "" }
MemoryEditorPage.jsx:150:11
🔄 MemoryEditorPage render method called from , Instance: ${instanceId} MemoryEditorPage.jsx:1324:13
🟡 Rendering found: 49de3704-7236-4606-9c0e-da0c1c6616be-0 MemoryEditorPage.jsx:1423:35
🟡 Total cache: 49de3704-7236-4606-9c0e-da0c1c6616be-0 MemoryEditorPage.jsx:1433:33
🎯 getToolbarPosition called - element dimensions:
Object { width: 348, height: 176, x: 756, y: 206 }
ElementToolbar.jsx:56:15
🎯 Node found! Using getClientRect(): ElementToolbar.jsx:104:15
🎯 Stage container rect:
DOMRect { x: 60, y: 60, width: 1860, height: 588, top: 60, right: 1920, bottom: 648, left: 60 }
ElementToolbar.jsx:105:15
🎯 Node client rect:
Object { x: 756, y: 206, width: 348, height: 176 }
ElementToolbar.jsx:106:15
🎯 Final screen coordinates:
Object { x: 816, y: 266, width: 348, height: 176 }
ElementToolbar.jsx:113:15
🎯 Toolbar will render at position:
Object { top: 146, left: 850 }
ElementToolbar.jsx:147:13
🎯 ===== ElementToolbar RENDER END ===== ElementToolbar.jsx:148:13
🔄 ElementToolar render: Element W=348 H=176, Position: (756, 206), Mode: select, Controls: 6 ElementToolbar.jsx:165:15
