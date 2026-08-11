<div align="center">

# 🔍 FindBack — Lost & Found Platform

**If someone found your item, you shouldn't have to be in the same Facebook group to have a chance of getting it back.**

FindBack is a web application that connects people who **lost** items with people who **found** them — using image-based matching and automatic owner notifications.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js%2014-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

**[🚀 Live Demo →](https://l-f-iota.vercel.app)**

</div>

---

## Why I Built FindBack

Losing an important item can be frustrating — but finding the person who lost it can be just as difficult.

Today, when someone loses or finds an item, one of the most common ways to report it is by posting on a **Facebook group or local community page**. The problem? Those posts only reach people who are already members of that particular group. If the actual owner isn't a member, they may never see the post — **even if someone has already found their item**.

That creates a simple but important problem:

> **The item may have been found, but the right person may never know about it.**

FindBack is a dedicated place for lost and found items — a central hub where you don't have to depend on being part of the same Facebook group or community to be reunited with your things.

---

## What is FindBack?

FindBack is a **Lost & Found web application** that connects people who have lost items with people who have found them.

Instead of searching through different social media posts, users simply:

```
Report a Lost Item → Upload a Photo → Add Details
```

or

```
Report a Found Item → Upload a Photo → Add Details
```

FindBack then compares reported lost and found items to identify possible matches. When a possible match is detected, the person who reported the lost item receives a notification so they can review the match.

---

## How It Works

The process is designed to be simple:

1. **Report a Lost Item** — upload a photo and provide details: item name, category, location, date, and description.
2. **Report a Found Item** — upload a photo and share similar information about where and when the item was found.
3. **Find Possible Matches** — FindBack compares the photos and other available information from lost and found reports to detect similarities.
4. **Notify the Owner** — when a possible match is detected, the person who reported the lost item receives an in-app notification.
5. **Check the Match** — the owner views the lost item and the possible found item side by side and decides whether they are likely the same item.

### The core journey

```
Lost → Found → Match → Notify → Reconnect
```

---

## The Main Idea

FindBack doesn't try to replace communities or social media. Instead, it creates a **dedicated system specifically designed for lost and found items**.

> **If someone found your item, you shouldn't have to be in the same Facebook group to have a chance of getting it back.**

FindBack brings lost and found reports into **one place** and uses image-based matching to help connect them.

### The problem in one line

> **A found item is useless to its owner if the owner never knows it was found.**

FindBack is built to help close that gap.

---

## Core Features

- 🔴 **Report Lost Items** — describe and photograph what you lost
- 🟢 **Report Found Items** — log items you've found so owners can find you
- 📷 **Photo Uploads** — validated, re-encoded images (JPG / PNG / WEBP)
- 📍 **Location & Date** — where and when the item was lost or found
- 📝 **Item Details** — category, name, and free-text description
- 🤖 **Image Similarity Matching** — perceptual image hashing (dHash) + text/location/date scoring
- 🎯 **Possible Match Detection** — real, honest similarity scores (never fake, never 100%)
- 🔔 **Owner Notifications** — the owner of the lost item is notified automatically
- 📚 **Personal History** — track everything you've reported (All / Lost / Found tabs)
- 🔎 **Browse Reports** — explore recent lost and found items
- 📱 **Responsive Interface** — works great on mobile, tablet, and desktop

> ⚠️ Every result is labeled a **Possible Match**, never a "confirmed" one — the score is a suggestion, not a guarantee of ownership.

---

## Tech Stack

| Layer            | Technology                                                     |
| ---------------- | -------------------------------------------------------------- |
| Frontend         | Next.js 14 (App Router) · React 18 · Tailwind CSS              |
| Backend          | Next.js Route Handlers (REST API)                              |
| Database         | MongoDB (Atlas) via Prisma ORM                                       |
| Auth             | iron-session (encrypted httpOnly cookie) + bcrypt              |
| Image matching   | Perceptual hashing (dHash) via **sharp** + scoring heuristics  |

### How the matching engine works

The similarity score is **real, not faked**. Each image is downscaled to 9×8 grayscale and reduced
to a 64-bit perceptual hash (dHash). Similar images produce similar hashes, and the Hamming distance
between them gives an honest image-similarity percentage. That is combined with name, category,
location, and date signals:

```
total = image(55%) + name(15%) + category(10%) + location(15%) + date(5%)
```

Pairs scoring **≥ 80%** become `Match` records (unique per lost×found pair, so re-running never
duplicates). The score is **capped at 99** on purpose — the system never claims 100% certainty.

The matching logic is isolated in [`src/matching/`](src/matching), behind a stable interface, so a
real deep-learning embedding model can be dropped in later without touching the rest of the app.

---

## Getting Started

### Prerequisites

- **Node.js 18.17+**
- **npm**

### 1. Clone and install

```bash
git clone https://github.com/<your-username>/L-F.git
cd L-F
npm install
```

### 2. Configure secrets

Create a `.env` file in the project root (it is git-ignored):

```env
# MongoDB Atlas connection string (free M0 cluster — https://www.mongodb.com/atlas)
DATABASE_URL=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/findback?retryWrites=true&w=majority

# Any long, random string — used to encrypt session cookies
SESSION_SECRET=generate-a-long-random-string-here
```

> You can generate one with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 3. Set up the database

```bash
npm run db:push   # creates the collections in MongoDB Atlas from the schema
```

### 4. Run it

```bash
npm run dev       # → http://localhost:3000
```

Optional — seed a demo account (`demo@example.com` / `demo1234`):

```bash
npm run db:seed
```

### Windows note (folder names with `&`)

npm scripts call `node` directly on each tool's entry point instead of `.bin` shims. This is
required because `cmd.exe` chokes on `&` in the project path (e.g. `Projects\L&F`). It's harmless
on every platform.

---

## Configuration

App-level settings live in [`src/lib/config.ts`](src/lib/config.ts) and [`src/matching/config.ts`](src/matching/config.ts).

| Setting          | Location             | Default                                  | Meaning                                        |
| ---------------- | -------------------- | ---------------------------------------- | ---------------------------------------------- |
| `matchThreshold` | `matching/config.ts` | `80`                                     | Min combined score (0-100) to create a match   |
| `weights`        | `matching/config.ts` | image .55, name .15, cat .10, loc .15, date .05 | Score composition                    |
| `maxResults`     | `matching/config.ts` | `5`                                      | Max possible matches returned per report       |
| `maxUploadBytes` | `lib/config.ts`      | 5 MB                                     | Image upload limit                             |

---

## Project Structure

```
src/
├── app/                  # Pages + API routes (Next.js App Router)
│   ├── api/
│   │   ├── auth/         # register / login / logout
│   │   ├── upload/       # image upload (validates, re-encodes via sharp)
│   │   ├── items/        # create reports + browse/search
│   │   ├── matches/[id]/interest/   # "Mark as My Item"
│   │   ├── notifications/           # list, mark read, mark all read
│   │   └── me/           # profile + dashboard stats
│   ├── page.tsx          # Home — "What brings you here?" choice screen
│   ├── browse/           # All | Lost | Found tabs + search filters
│   ├── history/          # My History — All | Lost | Found tabs
│   ├── notifications/    # notification list with unread states
│   ├── matches/[id]/     # match details (side-by-side + score breakdown)
│   ├── items/[id]/       # public item detail
│   ├── report/           # lost & found report forms
│   └── login/ register/ profile/
├── components/           # Navbar, ItemCard, ItemForm, ImageUploader, badges…
├── lib/                  # prisma client, auth/session, config, validators, utils, types
└── matching/             # ← the matching engine
    ├── config.ts         # threshold + weights
    ├── imageMatcher.ts   # dHash computation + Hamming distance
    ├── textMatcher.ts    # normalized token-overlap for names
    ├── locationMatcher.ts# string/containment similarity for locations
    ├── categoryMatcher.ts
    ├── dateMatcher.ts    # soft time-window similarity
    ├── score.ts          # combines matchers into one 0-99 score
    └── matchService.ts   # find matches + persist Match/Notification
```

---

## API Overview

| Method | Endpoint                          | Purpose                                  |
| ------ | --------------------------------- | ---------------------------------------- |
| POST   | `/api/auth/register` `/login` `/logout` | Session auth                       |
| POST   | `/api/upload`                     | Upload image → URL                       |
| POST   | `/api/items`                      | Create lost/found report **and run matching** |
| GET    | `/api/items?type=&q=&category=`   | Browse/search                            |
| GET    | `/api/notifications`              | List notifications + unread count        |
| POST   | `/api/notifications/[id]/read`    | Mark one read                            |
| POST   | `/api/notifications/read-all`     | Mark all read                            |
| POST   | `/api/matches/[id]/interest`      | Owner marks match as "my item"           |
| GET    | `/api/me`                         | Profile + dashboard stats                |

---

## Data Model & Statuses

**Models:** `User`, `LostItem`, `FoundItem`, `Match`, `Notification` (see [`prisma/schema.prisma`](prisma/schema.prisma)).

- **Lost items:** `Searching` → `Possible Match` → `Matched` → `Returned`
- **Found items:** `Available` → `Matched` → `Returned`
- **Matches:** `POSSIBLE` → `OWNER_INTERESTED`

`Matched` / `Returned` are set by "Mark as My Item" and the future return flow; ownership
verification and safe return are out of scope for the MVP.

---

## UX States Implemented

Loading, uploading, upload success/failure, report submitting, a staged matching-in-progress
animation (*"Analyzing image… → Comparing with reported items… → Looking for similarities…"*),
possible match found, no possible match yet, empty states, invalid forms, and network/server
errors — each with its own message.

---

## Roadmap

- **V2** — push notifications, map/location picker, improved AI matching (image embeddings), better search
- **V3** — owner↔finder chat, verification questions, safe return flow, admin dashboard
- **V4** — object detection, smart recommendations, campus/organization instances

---

## Scripts

```bash
npm run dev          # dev server → http://localhost:3000
npm run build        # prisma generate + production build
npm run start        # production server
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run db:push      # sync schema → SQLite
npm run db:generate  # regenerate the Prisma client
npm run db:seed      # create demo user
npm run db:reset     # wipe and recreate the database
```

---

## License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

---

<div align="center">

**Built to close the gap between a found item and its owner.** 🤝

</div>
