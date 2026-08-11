# ARCHITECTURE.md: Digital Wardrobe & Outfit Planner (ClosetKeeper)

## 1. Executive Summary & Tech Stack

This document details the system architecture, component organization, and data lifecycle for **ClosetKeeper**. The architecture is structured for high modularity, performance, and responsive mobile-first performance.

### Tech Stack Overview
* **Framework:** Next.js (React) with App Router
* **Styling:** Tailwind CSS (Mobile-first responsive design)
* **State Management:** React Context API / Custom Hooks (Client state & UI filters)
* **Data Persistence (POC):** Browser `localStorage` abstraction layer (designed for seamless migration to Supabase/PostgreSQL)
* **Image Processing & Storage:** Client-side HTML5 Canvas / Data URLs (for local compression and background isolation)
* **Icons & UI Utilities:** Lucide React icons, Tailwind Merge

---

## 2. High-Level System Architecture
+-----------------------------------------------------------------------+
|                            CLIENT LAYER                               |
|                                                                       |
|   +-----------------------+     +---------------------------------+   |
|   |   UI Components       | <-> |   State Management              |   |
|   |   (Grid, Builder,     |     |   (React Context / Custom Hooks)|   |
|   |    Upload Form)       |     +---------------------------------+   |
|   +-----------------------+                      ^                    |
|               |                                  |                    |
+---------------|----------------------------------|--------------------+
|                                  |
v                                  v
+-----------------------------------------------------------------------+
|                          SERVICE LAYER                                |
|                                                                       |
|   +-----------------------+     +---------------------------------+   |
|   |  Image Service        |     |  Storage Adapter                |   |
|   |  (Canvas / Crop)      |     |  (LocalStorage Engine)          |   |
|   +-----------------------+     +---------------------------------+   |
+-----------------------------------------------------------------------+


---

## 3. Directory & Component Structure

closet-keeper/
├── PRD.md
├── ARCHITECTURE.md
├── README.md
├── public/
│   └── favicon.ico
└── src/
├── app/
│   ├── layout.tsx            # Root layout with Provider wrappers
│   ├── page.tsx              # Home / Dashboard screen
│   ├── wardrobe/
│   │   └── page.tsx          # Wardrobe Inventory & Grid screen
│   ├── add-item/
│   │   └── page.tsx          # Photo upload & tagging form screen
│   └── generator/
│       └── page.tsx          # Outfit generator & recommendation screen
├── components/
│   ├── common/
│   │   ├── Header.tsx        # Application top navigation bar
│   │   ├── BottomNav.tsx     # Mobile sticky navigation
│   │   └── Badge.tsx         # Tag badge for status & categories
│   ├── wardrobe/
│   │   ├── WardrobeGrid.tsx  # Responsive item cards grid
│   │   ├── ItemCard.tsx      # Individual clothing card with toggles
│   │   ├── FilterBar.tsx     # Category, Occasion, and Status filters
│   │   └── SearchInput.tsx   # Search bar input
│   ├── add-item/
│   │   ├── ImageUploader.tsx # Photo capture, drop, and preview
│   │   └── TaggingForm.tsx   # Metadata selection controls
│   └── generator/
│       ├── OutfitCard.tsx    # Paired outfit set view
│       └── MatchControls.tsx # Occasion & filter selector
├── context/
│   └── WardrobeContext.tsx   # Context API for local state management
├── hooks/
│   ├── useWardrobe.ts        # Custom hook for CRUD operations
│   └── useImageProcess.ts    # Custom hook for image compression & crop
├── lib/
│   ├── constants.ts          # Default categories, occasions, colors
│   ├── storage.ts            # LocalStorage engine with schema validation
│   └── matchingEngine.ts     # Rule-based outfit generator logic
└── types/
└── index.ts              # TypeScript interfaces and type definitions


---

## 4. TypeScript Type Definitions (`src/types/index.ts`)

```typescript
export type Category = 
  | 'Top' 
  | 'Bottom' 
  | 'One-Piece' 
  | 'Layer' 
  | 'Footwear' 
  | 'Accessory';

export type Occasion = 
  | 'Casual' 
  | 'Formal' 
  | 'Festive' 
  | 'Party' 
  | 'Sports';

export type Color = 
  | 'Black' 
  | 'White' 
  | 'Blue' 
  | 'Red' 
  | 'Green' 
  | 'Beige' 
  | 'Multicolor';

export interface ClothingItem {
  id: string;
  title: string;
  imageUrl: string;
  category: Category;
  occasions: Occasion[];
  color: Color;
  isClean: boolean;
  lastWornDate: string | null; // ISO Date String
  createdAt: string;          // ISO Date String
}

export interface Outfit {
  id: string;
  title: string;
  occasion: Occasion;
  items: ClothingItem[];
  isFavorite: boolean;
  createdDate: string;
}

export interface FilterState {
  category: Category | 'All';
  occasion: Occasion | 'All';
  isCleanOnly: boolean;
  searchQuery: string;
}

5. Core Data Flows
Flow 1: Item Ingestion & Image Compression
[User Selects Photo] 
        │
        ▼
[ImageUploader Component] 
        │
        ▼
[useImageProcess Hook] ──(Compress Image to < 200KB via Canvas)──► [Base64 / DataURL]
        │
        ▼
[TaggingForm Submission] 
        │
        ▼
[useWardrobe.addItem()] ──(Validate & Format Schema)──► [Storage Adapter] ──► [LocalStorage]
        │
        ▼
[WardrobeContext Updated] ──(Re-render Grid View)
Flow 2: Outfit Matcher Execution
[User Selects Occasion Filter (e.g., "Festive")]
        │
        ▼
[matchingEngine.generateOutfits(items, occasion)]
        │
        ├─► 1. Filter items: item.isClean === true AND item.occasions.includes(occasion)
        ├─► 2. Group items into buckets: Tops, Bottoms, One-Pieces, Layers, Footwear
        ├─► 3. Generate Valid Pairs:
        │       ├── Path A: 1 Top + 1 Bottom (+ Optional Layer + Footwear)
        │       └── Path B: 1 One-Piece (+ Optional Layer + Footwear)
        └─► 4. Sort combinations by least recently worn items (lastWornDate)
        │
        ▼
[Render Recommended Outfit Cards in UI]