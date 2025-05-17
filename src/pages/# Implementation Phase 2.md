# Implementation Phase 2

## Transition from `canvasService` to `memoryService`

In this phase, we are transitioning from using `canvasService` to `memoryService`. Below are the changes required:

### Import Statements

Replace:
```javascript
import { canvasService } from "../services/canvasService";
```

With:
```javascript
import { memoryService } from "../services/memoryService";
```

### Usage Examples

Replace:
```javascript
const canvases = await canvasService.getCanvases();
```

With:
```javascript
const memories = await memoryService.getMemories();
```

Replace:
```javascript
const canvas = await canvasService.getCanvas(id);
```

With:
```javascript
const memory = await memoryService.getMemory(id);
```

Replace:
```javascript
const newCanvas = await canvasService.createCanvas(title);
```

With:
```javascript
const newMemory = await memoryService.createMemory(title);
```

Replace:
```javascript
await canvasService.updateCanvas(id, canvasData);
```

With:
```javascript
await memoryService.updateMemory(id, memoryData);
```

Replace:
```javascript
await canvasService.deleteCanvas(id);
```

With:
```javascript
await memoryService.deleteMemory(id);
```

These changes ensure that the application now uses `memoryService` for all memory-related operations.