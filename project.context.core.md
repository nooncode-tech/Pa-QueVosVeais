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



\- Menu CRUD (Supabase + Realtime)

\- Category CRUD (Supabase + Realtime)

\- Menu grouped by category

\- Image upload to Supabase Storage

\- Orders system (localStorage — NOT yet in Supabase)

\- Table sessions (localStorage — NOT yet in Supabase)

\- Kitchen preparation states (KDS view, dual station A/B)

\- Inventory system with ingredients and recipes

\- Extras system per menu item

\- Ingredients recipe system with receta JSONB

\- Category ordering (orden column in DB)

\- Admin panel interface (sidebar desktop + tabs mobile)

\- Supabase Auth (login/logout, session restore, onAuthStateChange)

\- User roles: admin, mesero, cocina_a, cocina_b, cliente

\- Audit log viewer (Bitácora in admin panel)

\- Daily closing (Corte de Caja)

\- Refunds system

\- QR code generation and download

\- Delivery zones manager

\- Table history

\- Waiter calls system

\- Print system: kitchen ticket, customer receipt

\- Rewards system (UI only)

\- Reports manager (basic: today/week/month range, top items, channel breakdown)

\- Toast notifications for errors



Incomplete or in progress:



\- Orders and table_sessions NOT migrated to Supabase (still localStorage = no multi-device sync, no realtime for kitchen)

\- Drag & drop for categories and menu items (not implemented)

\- Analytics dashboard (basic reports exist, no charts or historical trends)

\- Payment integrations (simulated only)

\- Tests automatizados (none)

\- Multi-restaurant support (single-tenant only)

\- Advanced role permissions (roles exist, no fine-grained access control)

\- Inventory deductions not transactional



Blocking progress now:



\- Orders in localStorage = cocina no recibe pedidos nuevos en tiempo real entre dispositivos

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



\## 10. WHAT MUST NOT BE DONE (from PDF)



\- Lógica crítica solo en frontend (context.tsx)

\- Uso de service\_role key en cliente

\- Dependencia excesiva en localStorage



\---



\## 11. NEXT RECOMMENDED STEP 🔄



Skill:

Backend / Architecture



Router mode:

New Build / Full



Task:



Migrar orders, order\_items y table\_sessions a Supabase para habilitar Realtime en pedidos (cocina ve nuevos pedidos sin recargar).



Reason:



Orders son el core del POS. Actualmente en localStorage = no hay sincronización entre dispositivos. Migrar a Supabase desbloquea Realtime, persistencia real y futuros analytics. Es el gap más crítico según el PDF de especificaciones.



\---



\## 12. LAST UPDATE 🔄



Date:

2026-03-21



Session:

Chunk 6: Audit log, print system, reports con rangos, inventory mejoras, auth, toast errors, migrations 005/006



Summary:



Nuevo proyecto Supabase (bpamwnayttumghxbdtrs). 5 usuarios en Auth (@pqvv.local). Schema: profiles (RLS), categories, menu\_items (cocina, receta, extras JSONB), storage bucket menu-images. RLS via get\_my\_role(). Realtime para menu\_items y categories. Audit log (logAction) en context.tsx + AuditLogViewer en admin. Print system para tickets de cocina y cuenta. Reports con selector hoy/semana/mes. Inventory con AlertDialog para borrado y validación de stock negativo. Migration 005 (transferencia payment method), 006 (receta/extras columns). Login sin acceso rápido demo. Placeholder.svg añadido.

