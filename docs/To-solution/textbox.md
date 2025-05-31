# T

You're building a focused, memory-sharing app with a canvas-based experience for personal storytelling through photos and annotations.

---

## ✅ **Core Features for Textbox (MVP-Level)**

These are **must-have** elements for usability and emotional expression without overwhelming non-technical users:

### 1. **Font Options (Minimal but expressive)**

- **Font family**: Offer 3–5 curated fonts (e.g., Sans-serif for modern, Serif for elegance, Handwritten for personal tone, Comic for playful).
- **Font size**: Scalable by slider or dropdown.
- **Font color**: Color picker or preset swatches.

### 2. **Text Alignment**

- For **text areas (multi-line)**: Left, Center, Right (standard).
- For **textboxes (single-line or resizable)**:
  - **Default: Center aligned** both horizontally and vertically **within the textbox bounds**.
  - Optionally: Allow **drag-based resizing** of the box with **auto-fit** behavior (shrink/grow around text).
  - **Do not** complicate with text alignment for single-line — it's rarely used unless designing posters or advanced layouts.

### 3. **Background and Outline Styles**

- Support **optional background shapes**:
  - Rounded rectangle
  - Cloud (for “thoughts” or emotions)
  - Speech bubble
- You can **automate this** with a toggle (e.g., “Make it a bubble”) instead of needing to draw first.
- Border: Allow stroke thickness and color.

### 4. **Drag, Resize, Rotate**

- Drag-and-drop to reposition.
- Resizable handles with constraints (e.g., minimum size).
- Simple rotation (optional but delightful).

---

## 🎨 **Optional but Differentiating (Delightful Features)**

These set you apart and build emotional engagement:

### 1. **Auto-Cloud / Speech-Bubble Smart Wrap**

> Instead of forcing the user to draw a shape, offer a toggle in the toolbar:

- "Wrap in: [None | Cloud | Speech | Rounded Box]"
- On selection, it **automatically shapes around** the text.
- This is faster and more intuitive than traditional shape-first flow.

### 2. **“Emotion Tags” or “Stickers with Text”**

- Predefined emotion-based templates (e.g., “So happy!”, “Wish you were here”) with text + illustration combo.
- These are **optional templates** users can customize or delete text inside.

### 3. **Auto Layout Aids**

- Snap to grid or alignment guides.
- Smart alignment when dragging multiple objects (e.g., centering relative to the photo).

### 4. **Responsive Textbox**

- Auto-resizing textbox: The box grows with the text (like sticky notes or chat bubbles).
- Optionally support **fixed box + scroll** for those who want to limit visual size.

---

## ❌ What to **Avoid** (for MVP)

- Rich-text editing (bullets, inline bold/italic/underline) — too much.
- Custom shape drawing — defer to advanced mode later.
- Layer effects (blur, shadows, glow) — unnecessary early on.

---

## 🧠 Technical and Dev Tips

Since you're aiming for low-complexity with existing components:

- Use **existing libraries** like:
  - [Konva.js](https://konvajs.org/) for canvas manipulation (text + shape + image)
  - [Fabric.js](http://fabricjs.com/) — great for textbox, image, and shape layering with minimal code
- Ensure **keyboard accessibility** for text editing.
- Use **grouped objects** (text + shape as a group) for bubble/cloud — easier to move as a unit.
- Create new class for this textbox component under /workspace/src/pages/MemoryEditorPage/components

---

## ✅ Summary of What to Include (UX Checklist)

| Feature                | Required?  | Default Behavior   |
| ---------------------- | ---------- | ------------------ |
| Font choice (3–5)      | ✅         | Sans-serif         |
| Font size & color      | ✅         | Medium, black      |
| Center align (textbox) | ✅         | Center             |
| Textbox auto-fit       | ✅         | Grows with text    |
| Background shapes      | ✅         | Off by default     |
| Cloud/speech wrap      | ✅         | Toggled on toolbar |
| Drag, resize, rotate   | ✅         | Free move          |
| Auto-align guides      | ✅         | Smart assist       |
| Emotion tag templates  | Optional   | Fun entry point    |
| Shape drawing          | ❌ (Later) | Use toggle instead |

---

## Screen

a floating, context-sensitive toolbar near the textbox

## 💡 Final Design Tip

Make **expressiveness frictionless**. The more you reduce clicks for something emotional (like adding a feeling to a photo), the more your users will engage. Default to **simple** and offer a path to **playful customization**, but never require it.

Let me know if you want a wireframe or component-based layout suggestion for this!
