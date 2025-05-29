# PhotoSharing

## Reference:

https://www.photoprism.app/

# Key Design Principles

### 📱 Device Support

| Feature                             | Description                                                                   |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| 💻 **Desktop + 📱 Mobile Friendly** | Responsive UI for both desktop and touchscreen mobile devices.                |
| 🖱️ **Mouse + Touch Input**          | Supports drag/drop, zoom/pinch, drawing via mouse or finger.                  |
| 💡 **Clean UI**                     | Designed for non-technical users. Buttons labeled clearly with helpful icons. |

Based on the specification document, I'll design screens with these principles in mind:

- **Simplicity**: Clean layouts with clear visual hierarchy
- **Intuitive navigation**: Familiar patterns users already understand
- **Minimal cognitive load**: Focused interfaces that don't overwhelm
- **Accessibility**: Designs that work for users of all ages (teens to elderly)
- **Consistency**: Similar patterns and interactions across screens

# App Vision

A digital canvas-based photo-sharing app designed to emulate the nostalgic experience of physical photo albums, allowing users to present and share personal memories in a creative, customizable, and story-driven format. Open source and hosted per user via subdomain for personalization.

# Out of Scope / Not Included

- ❌ AI face detection or tagging
- ❌ Search or smart albums
- ❌ Complex filters or advanced photo editing
- ❌ Social media features (likes, followers, etc.)

# Overall Roadmap

**Photo Canvas Sharing App - Feature Roadmap Document**

**App Vision:**

A digital canvas-based photo-sharing app designed to emulate the nostalgic experience of physical photo albums, allowing users to present and share personal memories in a creative, customizable, and story-driven format. Open source and hosted per user via subdomain for personalization.

---

### **Phase 1: Foundation + Core Canvas Sharing (MVP)**

**Goal:** Deliver the most unique and differentiating user experience — a memory-sharing canvas with drawing, text, and photos.

**Core Features:**

1. **Infinite Canvas** (L1)
   - No fixed canvas boundary.
   - Optional grid/page-view overlay for orientation only.
2. **Photo Insertion (Direct-to-Canvas)** (L1)
   - Users insert photos directly into the canvas.
   - No mandatory photo library.
3. **Drawing Tools** (L1)
   - Pen, eraser, color picker.
4. **Text Box** (L1)
   - Add editable text with formatting options.
5. **Zoom & Pan Controls** (L1)
   - Smooth zoom in/out.
   - Free pan navigation.
6. **Basic Object Manipulation** (L1)
   - Move, resize, rotate photos, drawings, and text.
7. Z-Order (Object stacking) control (L2)
   - Bring forward / send backward objects.
8. **Canvas Display Modes** (L2)
   - Grid overlay showing dynamic 'page' boxes.
   - Toggle on/off view.
9. **Save/Auto-Save Canvas** (L1)
   - Save progress.
   - Restore on re-open.
10. **Custom Subdomain Setup** (L2)
    - yourname.[appdomain].com style personalization.
11. **Owner Login via Passphrase** (L2)
    - `/owner` login with passphrase.
12. **Basic Share Options** (L1)
    - Share public/private with token (e.g., `specialdays123`).
    - Shared via clean short URL: yourname.domain.com
13. **Open Source Ready Architecture** (L3)
    - Self-hostable, customizable repo.

---

### **Phase 2: Add-on Features & Enrichment**

**Goal:** Improve the usability, organization, and social dimension of canvas sharing.

**Enhancement Features:**

1. **Object Snapping & Alignment Aids** (L2)
   - Guides and auto-align.
2. **Emoji Support** (L2)
   - Insert and move emojis like stickers.
3. **Photo Reuse (Internal Library)** (L2)
   - Uploaded photos stored for reuse across canvases.
   - Optional access to previous uploads.
4. **Canvas Metadata Organization Views** (L3)
   - Organize/view by time, place, tags.
5. **Canvas Template Presets** (L3)
   - Blank, birthday, trip, baby album themes.
6. **Multi-Canvas Navigation** (L3)
   - User manages multiple canvases (like albums).
7. **Export to Image/PDF** (L3)
   - Flatten canvas to download.
8. **Version History / Undo-Redo System** (L3)
   - Track changes over time.
9. **Shared With Me (Token Save)** (L4)
   - Users save tokens of shared canvases.
10. **Sharable Comments or Reactions** (L4)

- Public/friend comments on shared canvas.

---

### **Phase 3: Optional / Social Layer / Quality-of-Life**

**Goal:** Extend the app to provide richer user interaction and personalization.

**Extended Features:**

1. **Multi-User Collaboration on Canvas** (L5)
   - Shared edit rights.
2. **User Profile & Display Customization** (L4)
   - Profile picture, intro text.
3. **Canvas Discovery (Opt-in Indexing)** (L5)
   - Explore publicly shared canvases.
4. **Canvas Sharing Scheduler / Expiry** (L4)
   - Set expiration time for shared canvases.
5. **Notification System** (L5)
   - Canvas opened / commented alert.
6. **Access Tokens Management Panel** (L5)
   - Owners manage who has access by token.
7. **Cloud Sync for Backup** (L4)
   - Backup to personal cloud drive.
8. **Comments or Lightbox** on view mode
9. Admin-Controlled User System

   | Feature                   | Description                                                 |
   | ------------------------- | ----------------------------------------------------------- |
   | ❌ No Public Registration | Only the admin can create user accounts                     |
   | 👤 Admin Dashboard        | Admin can add/edit/delete users manually                    |
   | 🔐 Secure Logins          | Each user has their own login credentials                   |
   | 📁 Isolated Content       | Users can only see and manage their own albums and uploads  |
   | ⚙️ Role: Admin vs User    | Admin has additional access: view all content, manage users |

---

**Legend for Priority Level:**

- **L1**: Critical for MVP (Must-have)
- **L2**: High appeal, still core
- **L3**: Useful enhancement
- **L4**: Nice to have / advanced user feature
- **L5**: Optional / niche / social scaling

---

This document outlines the user-facing features. Technical design should ensure extensibility for Phase 2 and 3 features while keeping MVP (Phase 1) clean and focused.

Let me know when you're ready for the **technical architecture planning** or **UI/UX wireframe sketching** based on this.

# Details Spec:

## Phase 1:

## 1. Dashboard

- **List of Memories**
  - Thumbnail (auto-snapshot of canvas)
  - Title
  - Last edited timestamp
  - Actions: Edit, Share, Delete
- **Create Canvas** button → prompts for a canvas title.

---

## 2. Memory Editor

### A. Top Menu

Left: Back, Logo

Right: Add photo, Save, **Share ,** User Icon

### B. Control Above Workspace

Grid

### C. Control Beside Workspace

| Icon    | Action                                |
| ------- | ------------------------------------- |
| Pan     |                                       |
| ✍️ Text | Add a text box anywhere               |
| 🖌️ Draw | Freehand brush (color/width controls) |

| Icon        | Action |
| ----------- | ------ |
| Zoom In     |        |
| Zoom Out    |        |
| Full Screen |        |

### C. Workspace

- **Infinite/Scrollable Canvas**
  - Drop photos anywhere, resize, rotate,
- **Photo Elements**
  - Drop photos anywhere, resize, rotate,
  - tool bar close to photo: delete, bring to front, bring to back
  - click on photo and press delete button: delete
- **Text Elements**
  - Click to type, drag/resize, style (font, size, color)
  - tool bar close to textbox: delete
  - click on text element and press delete button: delete
- **Drawing Layer**
  - Scribble arrows, circles, highlight

---

### D. Screen Design:

![image.png](image.png)

![image.png](image%201.png)
