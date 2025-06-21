🔄 Dasboard Page render method called DashboardPage.jsx:380:13
🔵 [DB] Retrive Memory. Triggered with useEffect #3 MemoryEditorPage.jsx:216:13
🔵 useEffect #6 - Keyboard events fired MemoryEditorPage.jsx:542:13
🔄 [RENDER] MemoryEditorPage is re-render MemoryEditorPage.jsx:1288:13
🔄 [RENDER]: 78eac599-9c35-4cb2-8454-c67df99b0494-0-React RendererFactory.jsx:23:15
🔄 [RENDER]: text-71i1r0nmu-0-React RendererFactory.jsx:23:15
🔄 [RENDER]: text-kekih49cm-0-React RendererFactory.jsx:23:15
🔄 [RENDER] MemoryEditorPage is re-render MemoryEditorPage.jsx:1288:13
🔄 [RENDER]: 78eac599-9c35-4cb2-8454-c67df99b0494-0-React RendererFactory.jsx:23:15
🔄 [RENDER]: text-71i1r0nmu-0-React RendererFactory.jsx:23:15
🔄 [RENDER]: text-kekih49cm-0-React RendererFactory.jsx:23:15
Delayed check - scale: 1 position:
Object { x: 0, y: 0 }
MemoryEditorPage.jsx:524:19
🔍 [Click] Detect Click On Element text-kekih49cm MemoryEditorPage.jsx:198:21
🔍 [SELECT]:
Object { from: null, to: "text-kekih49cm" }
MemoryEditorPage.jsx:168:15
🔄 [SELECT]: text-kekih49cm useCanvasElements.js:17:13
🔄 [RENDER] MemoryEditorPage is re-render MemoryEditorPage.jsx:1288:13
🔄 [RENDER]: 78eac599-9c35-4cb2-8454-c67df99b0494-0-React RendererFactory.jsx:23:15
🔄 [RENDER]: text-71i1r0nmu-0-React RendererFactory.jsx:23:15
🔄 [RENDER]: text-kekih49cm-0-React RendererFactory.jsx:23:15
🔄 [RENDER] Toolbar: id=text-kekih49cm W=524 H=157, Position: (203.9999999999999, 207.99999999999991), ElementToolbar.jsx:172:13
🔵 useEffect #6 - Keyboard events fired MemoryEditorPage.jsx:542:13
🗑️ [USER] Deleting element: text-kekih49cm MemoryEditorPage.jsx:155:15
🔄 [SELECT]: undefined useCanvasElements.js:17:13
🗑️ [REMOVE] Removed element: text-kekih49cm useCanvasElements.js:163:15
🔄 [RENDER] MemoryEditorPage is re-render MemoryEditorPage.jsx:1288:13
🔄 [RENDER]: 78eac599-9c35-4cb2-8454-c67df99b0494-0-React RendererFactory.jsx:23:15
🔄 [RENDER]: text-71i1r0nmu-0-React RendererFactory.jsx:23:15
🔵 useEffect #6 - Keyboard events fired MemoryEditorPage.jsx:542:13
memoryService.updateMemory called:
Object { id: 416, data: '{\n "title": "Untitled Memory",\n "canvas": {\n "photos": [\n {\n "id": "78eac599-9c35-4cb2-8454-c67df99b0494",\n "type": "photo",\n "x": 1433.3650767304875,\n "y": 195.73091192795067,\n "width": 382,\n "height": 193,\n "rotation": 42.33011023799231,\n "originalWidth": 1860,\n "originalHeight": 943,\n "size": "75042"\n }\n ],\n "texts": [\n {\n "id": "text-71i1r0nmu",\n "type": "text",\n "x": 343.1888795439055,\n "y": 265.5048790766631,\n "width": 430,\n "height": 30,\n "rotation": 46.41442321140214,\n "text": "New Text",\n "fontSize": 24,\n "fontFamily": "Arial",\n "fill": "#000000",\n "fontStyle": "normal",\n "textDecoration": "",\n "align": "center",\n "verticalAlign": "middle",\n "wrap": "word",\n "padding": 10,\n "backgroundColor": "",\n "backgroundShape": "none",\n "borderColor": "",\n "borderWidth": 0\n }\n ],\n "viewState": {\n "scale": 1,\n "position": {\n "x": 14,\n "y": -1\n }\n }\n },\n "photoStates": {\n "78eac599-9c35-4cb2-8454-c67df99b0494": "P",\n "text-71i1r0nmu": "P",\n "text-kekih49cm": "R"\n }\n}' }
memoryService.js:22:13
🔄 [RENDER] MemoryEditorPage is re-render MemoryEditorPage.jsx:1288:13
🔄 [RENDER]: 78eac599-9c35-4cb2-8454-c67df99b0494-0-React RendererFactory.jsx:23:15
🔄 [RENDER]: text-71i1r0nmu-0-React RendererFactory.jsx:23:15
XHRPUT
http://localhost:3000/api/memories/416
[HTTP/1.1 500 Internal Server Error 48ms]

updateMemory error:
Object { message: "Request failed with status code 500", response: {…} }
<anonymous code>:1:145535
🔄 [RENDER] MemoryEditorPage is re-render MemoryEditorPage.jsx:1288:13
🔄 [RENDER]: 78eac599-9c35-4cb2-8454-c67df99b0494-0-React RendererFactory.jsx:23:15
🔄 [RENDER]: text-71i1r0nmu-0-React RendererFactory.jsx:23:15
Source map error: Error: JSON.parse: unexpected character at line 1 column 1 of the JSON data
Stack in the worker:parseSourceMapInput@resource://devtools/client/shared/vendor/source-map/lib/util.js:163:15
\_factory@resource://devtools/client/shared/vendor/source-map/lib/source-map-consumer.js:1066:22
SourceMapConsumer@resource://devtools/client/shared/vendor/source-map/lib/source-map-consumer.js:26:12
\_fetch@resource://devtools/client/shared/source-map-loader/utils/fetchSourceMap.js:83:19

Resource URL: http://localhost:3001/%3Canonymous%20code%3E
Source Map URL: installHook.js.map

Memory update request received: {
memoryId: '416',
userId: 1,
body: '{\n' +
' "title": "Untitled Memory",\n' +
' "canvas": {\n' +
' "photos": [\n' +
' {\n' +
' "id": "78eac599-9c35-4cb2-8454-c67df99b0494",\n' +
' "type": "photo",\n' +
' "x": 1433.3650767304875,\n' +
' "y": 195.73091192795067,\n' +
' "width": 382,\n' +
' "height": 193,\n' +
' "rotation": 42.33011023799231,\n' +
' "originalWidth": 1860,\n' +
' "originalHeight": 943,\n' +
' "size": "75042"\n' +
' }\n' +
' ],\n' +
' "texts": [\n' +
' {\n' +
' "id": "text-71i1r0nmu",\n' +
' "type": "text",\n' +
' "x": 343.1888795439055,\n' +
' "y": 265.5048790766631,\n' +
' "width": 430,\n' +
' "height": 30,\n' +
' "rotation": 46.41442321140214,\n' +
' "text": "New Text",\n' +
' "fontSize": 24,\n' +
' "fontFamily": "Arial",\n' +
' "fill": "#000000",\n' +
' "fontStyle": "normal",\n' +
' "textDecoration": "",\n' +
' "align": "center",\n' +
' "verticalAlign": "middle",\n' +
' "wrap": "word",\n' +
' "padding": 10,\n' +
' "backgroundColor": "",\n' +
' "backgroundShape": "none",\n' +
' "borderColor": "",\n' +
' "borderWidth": 0\n' +
' }\n' +
' ],\n' +
' "viewState": {\n' +
' "scale": 1,\n' +
' "position": {\n' +
' "x": 14,\n' +
' "y": -1\n' +
' }\n' +
' }\n' +
' },\n' +
' "photoStates": {\n' +
' "78eac599-9c35-4cb2-8454-c67df99b0494": "P",\n' +
' "text-71i1r0nmu": "P",\n' +
' "text-kekih49cm": "R"\n' +
' }\n' +
'}'
}
Received canvas data: {
photos: [
{
id: '78eac599-9c35-4cb2-8454-c67df99b0494',
type: 'photo',
x: 1433.3650767304875,
y: 195.73091192795067,
width: 382,
height: 193,
rotation: 42.33011023799231,
originalWidth: 1860,
originalHeight: 943,
size: '75042'
}
],
texts: [
{
id: 'text-71i1r0nmu',
type: 'text',
x: 343.1888795439055,
y: 265.5048790766631,
width: 430,
height: 30,
rotation: 46.41442321140214,
text: 'New Text',
fontSize: 24,
fontFamily: 'Arial',
fill: '#000000',
fontStyle: 'normal',
textDecoration: '',
align: 'center',
verticalAlign: 'middle',
wrap: 'word',
padding: 10,
backgroundColor: '',
backgroundShape: 'none',
borderColor: '',
borderWidth: 0
}
],
viewState: { scale: 1, position: { x: 14, y: -1 } }
}
Extracted photos: [
{
id: '78eac599-9c35-4cb2-8454-c67df99b0494',
type: 'photo',
x: 1433.3650767304875,
y: 195.73091192795067,
width: 382,
height: 193,
rotation: 42.33011023799231,
originalWidth: 1860,
originalHeight: 943,
size: '75042'
}
]
Stripping photo 78eac599-9c35-4cb2-8454-c67df99b0494 metadata: {
original: {
id: '78eac599-9c35-4cb2-8454-c67df99b0494',
type: 'photo',
x: 1433.3650767304875,
y: 195.73091192795067,
width: 382,
height: 193,
rotation: 42.33011023799231,
originalWidth: 1860,
originalHeight: 943,
size: '75042'
},
stripped: {
id: '78eac599-9c35-4cb2-8454-c67df99b0494',
x: 1433.3650767304875,
y: 195.73091192795067,
width: 382,
height: 193,
rotation: 42.33011023799231
}
}
Updating existing view configuration
Processing photos: {
totalPhotos: 1,
photoStates: [
{ id: '78eac599-9c35-4cb2-8454-c67df99b0494', state: 'P' },
{ id: 'text-71i1r0nmu', state: 'P' },
{ id: 'text-kekih49cm', state: 'R' }
]
}
New photos to process: { count: 0, ids: [] }
Removed photos to process: { count: 1, ids: [ 'text-kekih49cm' ] }
Processing removal of photo text-kekih49cm
Error processing removal for photo text-kekih49cm: error: invalid input syntax for type uuid: "text-kekih49cm"
at /workspace/server/node_modules/pg/lib/client.js:545:17
at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
at async file:///workspace/server/routes/memory.js:315:37 {
length: 146,
severity: 'ERROR',
code: '22P02',
detail: undefined,
hint: undefined,
position: undefined,
internalPosition: undefined,
internalQuery: undefined,
where: "unnamed portal parameter $1 = '...'",
schema: undefined,
table: undefined,
column: undefined,
dataType: undefined,
constraint: undefined,
file: 'uuid.c',
line: '138',
routine: 'string_to_uuid'
}
Error in memory update: {
error: 'current transaction is aborted, commands ignored until end of transaction block',
stack: 'error: current transaction is aborted, commands ignored until end of transaction block\n' +
' at /workspace/server/node_modules/pg/lib/client.js:545:17\n' +
' at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n' +
' at async file:///workspace/server/routes/memory.js:361:26'
}
Error: error: current transaction is aborted, commands ignored until end of transaction block
at /workspace/server/node_modules/pg/lib/client.js:545:17
at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
at async file:///workspace/server/routes/memory.js:361:26 {
length: 145,
severity: 'ERROR',
code: '25P02',
detail: undefined,
hint: undefined,
position: undefined,
internalPosition: undefined,
internalQuery: undefined,
where: undefined,
schema: undefined,
table: undefined,
column: undefined,
dataType: undefined,
constraint: undefined,
file: 'postgres.c',
line: '1498',
routine: 'exec_parse_message'
}
Error Name: error
Error Code: 25P02
Error Message: current transaction is aborted, commands ignored until end of transaction block

DB:

configuration_data from viewconfig.sql

{
"texts": [
{
"x": 343.1888795439055,
"y": 265.5048790766631,
"id": "text-71i1r0nmu",
"fill": "#000000",
"text": "New Text",
"type": "text",
"wrap": "word",
"align": "center",
"width": 430,
"height": 30,
"padding": 10,
"fontSize": 24,
"rotation": 46.41442321140214,
"fontStyle": "normal",
"fontFamily": "Arial",
"borderColor": "",
"borderWidth": 0,
"verticalAlign": "middle",
"textDecoration": "",
"backgroundColor": "",
"backgroundShape": "none"
},
{
"x": 203.9999999999999,
"y": 207.99999999999991,
"id": "text-kekih49cm",
"fill": "#000000",
"text": "New Text",
"type": "text",
"wrap": "word",
"align": "center",
"width": 524,
"height": 157,
"padding": 10,
"fontSize": 24,
"rotation": 0,
"fontStyle": "normal",
"fontFamily": "Arial",
"borderColor": "",
"borderWidth": 0,
"verticalAlign": "middle",
"textDecoration": "",
"backgroundColor": "",
"backgroundShape": "none"
}
],
"photos": [
{
"x": 1433.3650767304875,
"y": 195.73091192795067,
"id": "78eac599-9c35-4cb2-8454-c67df99b0494",
"width": 382,
"height": 193,
"rotation": 42.33011023799231
}
],
"viewState": {
"scale": 1,
"position": {
"x": 14,
"y": -1
}
}
}

select \* from photos
"id","user_id","file_path","file_hash","mime_type","size_bytes","width","height","location_lat","location_lng","captured_place","captured_at","metadata","created_at","updated_at"
"78eac599-9c35-4cb2-8454-c67df99b0494",1,"78eac599/78eac599-9c35-4cb2-8454-c67df99b0494.webp","","image/webp","75042",1860,943,"","","","","{""displayWidth"":548,""displayHeight"":277,""uploadTimestamp"":""2025-06-21T13:16:33.598Z""}","2025-06-21 13:16:33.583246+00","2025-06-21 13:16:33.583246+00"
"ba9bdc73-0d4e-4d19-9930-2805ee119f1b",1,"ba9bdc73/ba9bdc73-0d4e-4d19-9930-2805ee119f1b.webp","","image/webp","75042",1860,943,"","","","","{""displayWidth"":348,""displayHeight"":176,""uploadTimestamp"":""2025-06-21T06:03:51.791Z""}","2025-06-21 06:03:51.773817+00","2025-06-21 06:03:51.773817+00"
