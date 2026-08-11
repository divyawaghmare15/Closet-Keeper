# PRD.md: Digital Wardrobe & Outfit Planner (ClosetKeeper)

## 1. Document Overview
* **Project Name:** ClosetKeeper (Digital Wardrobe & Outfit Planner)
* **Author:** Divya Waghmare
* **Version:** 1.0.0 (POC / MVP)
* **Status:** Draft / In Review
* **Target Launch:** Q3 2026

---

## 2. Executive Summary & Problem Statement

### 2.1 Problem Statement
Most individuals store their entire wardrobe inside cupboards and drawers. Over time, this creates visual clutter, leading to three major problems:
1. **Memory Fatigue & Decision Paralysis:** Users forget what clothes they own, especially formal, festive, or seasonal items stored out of sight.
2. **Underutilized Wardrobe ("80/20 Rule"):** Users repeatedly wear the same 20% of easily accessible clothes while 80% remains unworn.
3. **Event Confusion:** Preparing for specific functions (e.g., weddings, festive events, formal meetings) causes unnecessary stress and redundant shopping because users cannot easily view or combine their existing inventory.

### 2.2 Product Vision
A mobile-first web app that digitizes a user's closet into a searchable catalog, tracks laundry availability, and automatically suggests stylish outfit combinations based on occasions and wear history.

---

## 3. Target Audience & Core User Personas

* **Primary User:** Busy professionals and students who own 50+ clothing items and face daily decision fatigue when choosing outfits.
* **Secondary User:** Occasion planners who own heavy festive, traditional, or formal wear that is infrequently used and difficult to organize manually.

---

## 4. Goals & Non-Goals (Scope)

### 4.1 In-Scope (MVP / POC)
* Single-user digital wardrobe inventory catalog.
* Fast item uploading (photo, title, category, occasion, laundry status).
* Automatic image background isolation/cleanup for clean display.
* Search and multi-filter system (Category, Color, Occasion, Clean/In-Wash status).
* Rule-based Outfit Suggestion Engine (Top + Bottom pairing by Occasion).
* Basic Laundry Tracker toggle (`Clean` / `In Wash`).

### 4.2 Out-of-Scope (Future Iterations)
* Multi-user social sharing or public wardrobe profiles.
* Integrated e-commerce shopping links or affiliate marketing.
* Weather API auto-syncing (deferred to v2).
* Complex AI style advisor based on body shape / skin tone analysis.

---

## 5. User Stories & Core Workflows

### 5.1 Onboarding & Inventory Creation
* **US-01:** As a user, I want to upload a photo of my clothing item so that I can keep a digital record of it.
* **US-02:** As a user, I want uploaded images to have clean backgrounds so that my closet looks uniform and organized.
* **US-03:** As a user, I want to tag items with metadata (`Category`, `Occasion`, `Color`, `Clean Status`) so that I can search them easily.

### 5.2 Daily Wardrobe Management
* **US-04:** As a user, I want to toggle an item's status between `Clean` and `In Wash` so that I don't plan outfits around dirty clothes.
* **US-05:** As a user, I want to filter my closet by `Occasion` (e.g., *Festive*, *Office*, *Casual*) so I can view relevant options quickly.

### 5.3 Outfit Generation & Discovery
* **US-06:** As a user, I want the app to generate top-and-bottom outfit recommendations based on a selected occasion so that I don't have to guess what matches.
* **US-07:** As a user, I want to see items I haven't worn recently so that I can utilize my whole wardrobe evenly.

---

## 6. Detailed Feature Specifications

| Feature ID | Feature Name | Description | Priority |
| :--- | :--- | :--- | :--- |
| **FE-01** | Wardrobe Grid | Responsive visual gallery showing item images with category filters and search bar. | **P0 (Critical)** |
| **FE-02** | Add Item Form | Photo upload input with auto-tag dropdowns (Category, Occasion, Color). | **P0 (Critical)** |
| **FE-03** | Background Removal | Automated or canvas-based background isolation on uploaded image. | **P1 (High)** |
| **FE-04** | Laundry Toggle | Single-tap switch on item card to mark `Clean` or `In Wash`. | **P0 (Critical)** |
| **FE-05** | Outfit Matcher | Rules engine that combines 1 Top + 1 Bottom (or 1 One-Piece) matching the occasion filter. | **P0 (Critical)** |
| **FE-06** | Unworn Spotlight | Section displaying items with `lastWornDate` > 30 days. | **P2 (Medium)** |

---

## 7. Data Model & Entities

### 7.1 `ClothingItem` Schema
```json
{
  "id": "string (uuid)",
  "title": "string",
  "imageUrl": "string (url)",
  "category": "Top | Bottom | One-Piece | Layer | Footwear | Accessory",
  "occasions": ["Casual", "Formal", "Festive", "Party", "Sports"],
  "color": "string",
  "isClean": "boolean",
  "lastWornDate": "ISO Date String",
  "createdAt": "ISO Date String"
}