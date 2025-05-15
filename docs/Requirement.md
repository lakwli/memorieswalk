It is self-hosted photo sharing platform with a focus on creating an intuitive, user-friendly experience for all ages—from teenagers to older adults.

Target User:
Non-technical non designer but normal user could be students, teenager, parent, or anyone, whom just simply want to show their photo in a way they want to present it, just like old time with album with blank age, but now digitally.

Core App:
User can build Memories not only upload the picture, but mainly to capture meaningful moment, where memory play important hints to strong emotion, that they want to keep it, while this memory can make them back to the past with the feeling back again. User can present it from the Canvas to make it more life, from how they feel it, Ur perspective, how they want to share, be it footstep on world, or time based show your growing, or memory with certain people, or whatever. Hence ever.They can share to whoever they want.

Future extension:
a memory means Infinite Canvas. User can have other view (future, e.g. GridView, PlacesView, TimelineView).

Detail:

The web app should allow:
Uploading photos (drag & drop or mobile tap)
Placing them into Canvas
Generating a shareable link for others to view

Below are the key screens, highlighting the new Canvas feature.

1. **MyMemories (Dashboard)**
2. **MyMemories Editor**
3. **Share/Publish**

Here’s the super-simple spec:

---

# 📕 Minimum-Viable Digital MyMemories Album

## 1. My Memories (Dashboard)

- **List of Memories**

This is the central hub where users first land. I've kept it clean and minimal with:

Simple, prominent upload and create album buttons
Recent photos displayed in an easy-to-scan grid
Quick access to albums
A straightforward search function
User profile access in the top right

The dashboard helps users quickly find their content without overwhelming them with options.

---

## 2. MyMemories Editor

### A. Toolbar

| Icon      | Action                                |
| --------- | ------------------------------------- |
| 📁 Upload | Pick or drag-drop photos              |
| ✍️ Text   | Add a text box anywhere               |
| 🖌️ Draw   | Freehand brush (color/width controls) |
| 🔄 Rotate | Rotate selected element               |
| 📑 Layers | Bring forward / send backward         |
| 💾 Save   | Manual save (auto-save always on)     |
| 🔗 Share  | Generate read-only link               |

Freely position photos with intuitive drag-and-drop
Rotate photos using simple handles
Add text layers anywhere on the Canvas
Draw directly on the Canvas with a pen tool
Manage layers for complex compositions
Save their creation with a prominent button

The tools are represented with both icons and text labels to ensure clarity for all users, and the active tool is highlighted with color for easy identification.

### B. Workspace

- **Infinite/Scrollable Canvas**
- **Photo Elements**

  - Drop photos anywhere, resize, rotate, layer

- **Text Elements**

  - Click to type, drag/resize, style (font, size, color)

- **Drawing Layer**

  - Scribble arrows, circles, highlights

- **Auto-Save** every few seconds behind the scenes

---

## 3. Share & View

Clear options for public or private sharing
Simple link generation with copy functionality
Ability to set expiration dates
Options to allow/disallow downloads
Privacy controls that are easy to understand

---

## 4. Future-Proofing (Optional Later)

- **Multi-Page Support** (if needed)
- **Alternate “Gallery” View** (auto-arranged grid or timeline)
- **Comments or Lightbox** on view mode

---

6. Admin & Users
   Admin-Managed Accounts: only admin can create user logins

Each User sees only their own memories

No public signup
