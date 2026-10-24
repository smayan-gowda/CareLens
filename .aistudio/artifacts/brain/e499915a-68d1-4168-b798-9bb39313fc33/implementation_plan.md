# Mobile Photo Staging Vault & Cross-Device Scan Workflow

A cross-device photo capture and organization system allowing caregivers and older adults to photograph rooms on their phone, label and annotate them with room types and notes, and immediately scan them using CareLens AI's vision engine on their desktop computer.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following product decisions were confirmed during Phase 1 clarification:
> - **Vault Access**: Available as a dedicated **Photo Staging Vault** page (`/vault`) and integrated directly into the **Scan Workspace** (`/scan`).
> - **Cross-Device Handoff**: Real-time cloud sync powered by an on-screen **Desktop QR Code** modal, allowing instant mobile camera capture without typing URLs or re-logging in.
> - **Metadata & Organization**: Staged photos include **Room Type** selection, **Custom Title / Label**, and **Context Notes** (e.g., specific hazard observations noted while in the room).

---

## 1. Overview & Core Concept

- **What It Does**: Bridges the physical reality of room inspections—where high-quality cameras are on mobile phones but comprehensive safety analysis and reports are best reviewed on larger desktop monitors. Users snap photos on mobile, label them with zone tags and notes, and the photos immediately appear in the desktop staging vault ready for one-click AI computer vision audits.
- **Target Audience**: Family caregivers, aging-in-place specialists, and older adults who walk room-to-room taking snapshots on a smartphone and later review detailed audit scores and contractor quotes on their desktop or laptop.
- **Key Value**: Eliminates the cumbersome friction of emailing photos, AirDropping, or struggling with low-quality laptop webcams.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Desktop Launch & Mobile Pairing**:
   - On the Desktop **Scan Page** (`/scan`) or the new **Photo Vault** (`/vault`), the user sees a **"Capture on Phone"** button next to standard file upload.
   - Clicking opens a modal displaying a scannable **QR Code** and quick copy link containing a secure mobile handoff token.
2. **Mobile Capture & Labeling Flow**:
   - The user scans the QR code on their phone, opening a streamlined mobile-first capture interface (`/vault/mobile`).
   - The user taps **"Take Photo"** (using the mobile native camera) or selects from camera roll.
   - A clean card reveals:
     - **Room Category**: Selector (Bathroom, Bedroom, Kitchen, Living Room, Hallway, Stairs, etc.).
     - **Photo Title**: e.g., *"Master Bath Tub Rim & Floor"*.
     - **Observation Notes**: e.g., *"Slippery tile when damp, no grab bars installed"*.
     - **Target Property**: Auto-selected to the active home.
   - User taps **"Save to Staging Vault"**. The photo is compressed and stored with real-time sync.
3. **Desktop Real-Time Notification & Immediate Scan**:
   - On the desktop screen, a subtle toast and visual badge indicates *"New photo uploaded from phone"*.
   - The photo appears in the **Staged Photos Tray** with its label, room badge, and thumbnail.
   - Clicking **"Run Safety Scan"** on any staged photo instantly transfers the photo, selected property, and room context into the Computer Vision Analysis Workspace, triggering the safety scoring and hazard detection without re-uploading.

### Visual Identity & Theme
- **Theme Continuity**: Retains CareLens's warm minimalist ledger aesthetic, cream/dark slate neutral palettes, and refined typography (`Geist` variable font paired with `Instrument Serif` accents).
- **Zero-Pill Discipline**: Metadata (room type, capture device, timestamp) rendered as crisp, unboxed tabular text with subtle hairline dividers.
- **Interactive Feedback**: Smooth transitions using `motion/react`, responsive modal dialogs via Radix UI, and instant optimistic card states upon capture.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dedicated Vault Page vs. Scan-Only Drawer**
  - *Chosen Approach*: Implement a primary **Photo Vault** view (`/vault`) accessible from the main navigation, plus an embedded **Staging Drawer** inside `/scan`.
  - *Why*: Gives users a dedicated space to organize, edit labels, delete unwanted photos, and view past staged images, while maintaining zero-friction access when already inside the scan flow.
  - *Alternative Considered*: Only putting it inside `/scan` would make managing multi-photo batches difficult on mobile.

- **Decision 2: Direct Firestore Real-Time Sync for Image Metadata**
  - *Chosen Approach*: Store photo records in a dedicated `/stagedPhotos` Firestore collection with real-time `onSnapshot` listeners, using client-compressed base64 data URIs or hosted URLs via `storageService`.
  - *Why*: Provides sub-second cross-device synchronization between mobile camera capture and desktop viewport without polling or WebSockets.

- **Decision 3: Desktop-to-Mobile QR Handoff**
  - *Chosen Approach*: Generate an on-the-fly QR code linking to the mobile capture view with the current user's authenticated session context / property pre-selected.
  - *Why*: Allows instant phone camera activation without the user needing to manually type long URLs on their mobile keyboard.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Mobile Device (Phone)                           │
│   • Native Camera Capture via <input type="file" capture="environment">│
│   • Image Compression (<80KB) via Canvas & storageService              │
│   • Labeling Form: Room Type, Custom Title, Observation Notes          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         Firestore Document Write
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Cloud Firestore Storage                           │
│   Collection: /stagedPhotos/{photoId}                                  │
│   • userId, homeId, roomId, roomType, title, notes                     │
│   • imageUrl, status: 'unscanned' | 'scanned', createdAt               │
│   Security Rules: Protected by strict isOwner(userId) validation       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         Real-Time onSnapshot Sync
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Desktop Browser (Computer)                        │
│   • QR Code Generation (qrcode.react / lightweight SVG matrix)         │
│   • Photo Vault View (/vault): Grid of staged room photos & labels    │
│   • Scan Page Tray (/scan): "Select from Staged Photos" drawer         │
│   • One-Click Action: Launches Gemini Vision Assessment                │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model & Firestore Schema

```typescript
export interface StagedPhoto {
  id: string;
  userId: string;
  homeId: string;
  roomId?: string;
  roomType: RoomType;
  title: string;
  notes?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  status: 'unscanned' | 'scanned';
  scanId?: string;
  capturedFrom: 'mobile' | 'desktop';
  createdAt: string;
  updatedAt: string;
}
```

### Security Rules Update (`firestore.rules`)

```javascript
match /stagedPhotos/{photoId} {
  allow read, list: if isSignedIn() && resource.data.userId == request.auth.uid;
  allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
  allow update: if isSignedIn() && resource.data.userId == request.auth.uid;
  allow delete: if isSignedIn() && resource.data.userId == request.auth.uid;
}
```

### New & Updated Components

1. **`src/types/home.ts`**: Add `StagedPhoto` interface.
2. **`src/stores/useStagingStore.ts`**: Real-time Zustand store managing staged photo uploads, metadata editing, deletion, and status changes.
3. **`src/pages/PhotoVaultPage.tsx`**: High-fidelity desktop & mobile vault view for browsing, labeling, deleting, and initiating scans.
4. **`src/components/vault/MobileCaptureModal.tsx`**: Mobile-optimized camera capture interface with intuitive room type selectors and note fields.
5. **`src/components/vault/QrHandoffModal.tsx`**: Desktop modal generating the high-contrast QR code for phone handoff.
6. **`src/pages/ScanPage.tsx`**: Add "Staged Photos" drawer and "Capture on Phone" button alongside local upload.
7. **`src/components/layout/AppLayout.tsx`**: Add "Vault" to navigation header (`03 Vault` or accessible button beside Scan).
