\# project.context.core.md

> Default working context. Load in most sessions.

> Source of truth for the current operational state.

> For deep work (Recovery, Architecture, Validator, Infra, Security), also load project.context.full.md

> 🔄 = update every time the project state, blockers, risks, assumptions, or next step change.



\---



\## 1. IDENTITY



Project name:    Pa' Que Vos Veáis POS  

Objective:       Sistema POS para restaurantes que permite gestionar pedidos, menú, inventario y mesas desde una interfaz web conectada con cocina y clientes.  

Product type:    Fullstack Web Application (SaaS POS)  

State:           MVP funcional / Early production  

Repository:      https://github.com/nooncode-tech/Pa-QueVosVeais  

Owner:           NoonCode / Santiago Andrei  



\---



\## 2. STACK SUMMARY



Frontend:    Next.js 16 (React + Turbopack)  

Backend:     Supabase (PostgreSQL + API + Storage)  

Database:    PostgreSQL (Supabase)  

Infra:       Vercel deployment + Supabase cloud  

Key integrations:

\- Supabase Auth (future)

\- Supabase Storage (menu images)

\- Supabase Database (menu, orders, categories)

\- Vercel (hosting)

\- LocalStorage state sync (temporary caching)



\---



\## 3. ARCHITECTURE SUMMARY



Main modules:



\- Menu Manager

\- Category Manager

\- Orders System

\- Table Sessions

\- Kitchen System

\- Inventory Management

\- Users / Roles

\- Rewards System

\- Waiter Calls

\- QR Ordering System

\- Delivery Zones

\- Billing / Payments

\- Audit Logs

\- Refund System



Data source:



Primary DB: Supabase PostgreSQL



Main tables currently used:



\- menu\_items

\- categories

\- orders

\- order\_items

\- ingredients



Key dependencies:



\- Supabase database

\- Supabase storage

\- React context global state

\- Vercel hosting



Fragile points:



\- Sync between Supabase data and local React state

\- Category mapping (category\_id vs categoria)

\- Image upload consistency

\- State persistence between sessions

\- Inventory logic when ingredients run out



\---



\## 4. CRITICAL CONVENTIONS



Naming:



Database:

snake\_case



Frontend:

camelCase



Examples:



menu\_items

category\_id

updateMenuItem

addCategory



Folders structure:



/app

/components

/lib

/context

/ui



State is managed with:



React Context (AppProvider)



Tests:



Currently none implemented.



Planned:



\- Playwright (E2E)

\- Unit tests for critical business logic



Critical modules to test later:



\- Order creation

\- Inventory deduction

\- Menu availability logic

\- Category ordering



Docs:



Project architecture docs stored in:



/docs



Main operational context:



project.context.core.md



Deploy:



GitHub → Vercel automatic deployment.



Production:



https://pa-que-vos-veais.vercel.app/



Security:



\- Never expose Supabase service\_role key in frontend

\- Only public anon key allowed in client

\- Image uploads validated before sending to storage

\- Sensitive operations should eventually move to server functions



\---



\## 5. NON-NEGOTIABLE RESTRICTIONS



\- NEVER expose Supabase service role keys

\- NEVER break compatibility with current Supabase schema without migration

\- NEVER remove menu\_items.category\_id relationship



\- ALWAYS maintain compatibility with existing menu data

\- ALWAYS keep UI usable on tablets (restaurant usage)

\- ALWAYS ensure menu changes reflect instantly in admin panel



\---



\## 6. CURRENT STATE SUMMARY 🔄



Implemented and complete:



\- Menu CRUD

\- Category CRUD

\- Menu grouped by category

\- Image upload to Supabase Storage

\- Orders system

\- Table sessions

\- Kitchen preparation states

\- Inventory system

\- Extras system

\- Ingredients recipe system

\- Category ordering

\- Admin panel interface



Incomplete or in progress:



\- Multi-restaurant support

\- Production-grade inventory alerts

\- Analytics dashboard

\- Payment integrations

\- Realtime para orders/sessions (requiere migrar orders a Supabase)



Blocking progress now:



\- Need stronger architecture separation between DB state and local context



\---



\## 7. ACTIVE RISKS 🔄



Risk:

State mismatch between Supabase data and React Context state.



Severity:

High



Priority:

High



Owner skill:

Architecture / Backend



Mitigation:



Move more logic to server functions or real-time subscriptions.



Status:

Open



\---



Risk:

Inventory deduction logic could desync if orders are edited.



Severity:

Medium



Priority:

Medium



Owner skill:

Backend logic



Mitigation:



Introduce transactional updates.



Status:

Open



\---



\## 8. ACTIVE ASSUMPTIONS 🔄



Assumption:



The system will initially run for a single restaurant.



Why:



Current schema and architecture are single-tenant.



If false:



Multi-tenant architecture must be introduced.



Validate by:



Business scaling requirement.



\---



Assumption:



Kitchen workflow will use two stations (A and B).



Why:



Current design supports dual kitchen logic.



If false:



Kitchen architecture must become configurable.



Validate by:



Restaurant workflow testing.



\---



\## 9. OPEN DECISIONS 🔄



Decision:



How menu ordering should work.



Options:



A) Manual drag-and-drop ordering  

B) Automatic alphabetical order



Impact:



UI complexity and admin usability.



Owner skill:



Frontend UX



Trigger:



Admin usability improvements.



Status:



Open



\---



Decision:



Where business logic should live.



Options:



A) Frontend React context  

B) Supabase functions / backend



Impact:



Scalability and reliability.



Owner skill:



Architecture



Trigger:



Scaling beyond MVP.



Status:



Open



\---



\## 10. NEXT RECOMMENDED STEP 🔄



Skill:

Backend / Architecture



Router mode:

New Build / Full



Task:



Migrar orders, order\_items y table\_sessions a Supabase para habilitar Realtime en pedidos (cocina ve nuevos pedidos sin recargar).



Reason:



Orders son el core del POS. Actualmente en localStorage = no hay sincronización entre dispositivos. Migrar a Supabase desbloquea Realtime, persistencia real y futuros analytics.



\---



\## 11. LAST UPDATE 🔄



Date:

2026-03-19



Session:

Chunk 3+4+5: Nuevo Supabase desde 0 + Auth + Realtime para menu/categorías



Summary:



Nuevo proyecto Supabase (bpamwnayttumghxbdtrs). 5 usuarios creados en Supabase Auth via Admin API (admin, mesero1, mesero2, cocina_a, cocina_b — emails @pqvv.local). Schema completo creado via Management API: profiles (con RLS), categories (con orden column), menu\_items (con cocina column), storage bucket menu-images. RLS policies usando get\_my\_role() helper (lee JWT user\_metadata para evitar referencias circulares). User interface sin password. login/logout ahora async con supabase.auth. Session restore en mount via onAuthStateChange. Realtime habilitado para menu\_items y categories via ALTER PUBLICATION — context.tsx escucha INSERT/UPDATE/DELETE y actualiza estado local. mapMenuItem y mapCategory extraídos como helpers reutilizables.

