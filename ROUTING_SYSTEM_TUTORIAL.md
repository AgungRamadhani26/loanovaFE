# 🗺️ TUTORIAL LENGKAP: SISTEM ROUTING ANGULAR LOANOVA

## 📚 DAFTAR ISI

1. [Konsep Dasar Routing](#1-konsep-dasar-routing)
2. [Struktur Routing Aplikasi](#2-struktur-routing-aplikasi)
3. [Nested Routes (Parent-Child)](#3-nested-routes-parent-child)
4. [Layout-Based Routing](#4-layout-based-routing)
5. [Redirect Strategy](#5-redirect-strategy)
6. [Router Outlet](#6-router-outlet)
7. [Navigation Methods](#7-navigation-methods)
8. [Route Parameters](#8-route-parameters)
9. [Advanced Routing Patterns](#9-advanced-routing-patterns)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. KONSEP DASAR ROUTING

### 1.1 Apa itu Routing?

**Routing** adalah mekanisme untuk navigasi antar halaman dalam Single Page Application (SPA) tanpa reload halaman penuh.

```
Traditional Website (Multi-Page):
Browser → Request /page1.html → Server → Response HTML → Full Page Reload
Browser → Request /page2.html → Server → Response HTML → Full Page Reload

Angular SPA (Single-Page):
Browser → Request / → Server → Response index.html + app.js
        → Click link /page1 → Angular Router → Component A rendered
        → Click link /page2 → Angular Router → Component B rendered
                              (NO SERVER REQUEST, NO RELOAD)
```

**Keuntungan:**

- ⚡ Lebih cepat (tidak reload seluruh page)
- 🎨 Transition/animation antar halaman lebih smooth
- 📱 User experience seperti aplikasi native
- 🌐 Tetap support browser back/forward button
- 🔗 URL tetap bisa di-bookmark dan di-share

---

### 1.2 Angular Router Components

```
┌─────────────────────────────────────────────────┐
│              Angular Router System              │
│                                                 │
│  ┌──────────────┐      ┌──────────────┐        │
│  │   Routes     │      │   Router     │        │
│  │  (Config)    │─────►│  (Service)   │        │
│  │              │      │              │        │
│  │ - path       │      │ - navigate() │        │
│  │ - component  │      │ - url        │        │
│  │ - children   │      │ - events     │        │
│  └──────────────┘      └──────────────┘        │
│         │                     │                 │
│         │                     ▼                 │
│         │              ┌──────────────┐        │
│         │              │ RouterOutlet │        │
│         └─────────────►│ <component>  │        │
│                        │  renders     │        │
│                        │    here      │        │
│                        └──────────────┘        │
└─────────────────────────────────────────────────┘
```

**Key Components:**

1. **Routes**: Konfigurasi mapping URL → Component
2. **Router**: Service untuk navigasi programmatic
3. **RouterOutlet**: Placeholder untuk render component
4. **RouterLink**: Directive untuk navigasi di template

---

## 2. STRUKTUR ROUTING APLIKASI

### 2.1 File Konfigurasi Routes

**Location:** `src/app/app.routes.ts`

```typescript
import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/landing-page/landing-page.component';
import { LoginComponent } from './features/auth/login/login.component';
import { MainLayoutComponent } from './layout/shared/main-layout.component';
import { AdminLayoutComponent } from './layout/admin/admin-layout/admin-layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';

export const routes: Routes = [
  // Area 1: Public
  {
    path: '',
    component: MainLayoutComponent,
    children: [{ path: '', component: LandingPageComponent }],
  },

  // Area 2: Authentication
  { path: 'auth/login', component: LoginComponent },
  { path: 'login', redirectTo: 'auth/login', pathMatch: 'full' },

  // Area 3: Protected Admin
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'users', component: DashboardComponent },
      { path: 'branches', component: DashboardComponent },
      { path: 'roles', component: DashboardComponent },
      { path: 'loans', component: DashboardComponent },
      { path: 'history', component: DashboardComponent },
      { path: 'plafond', component: DashboardComponent },
    ],
  },

  // Area 4: Wildcard (404)
  { path: '**', redirectTo: '' },
];
```

---

### 2.2 Visualisasi Struktur Routes

```
┌──────────────────────────────────────────────────────────┐
│                    Root Route Tree                       │
│                                                          │
│  / (empty)                                               │
│  ├─► MainLayoutComponent                                 │
│  │   └─► LandingPageComponent                           │
│  │                                                       │
│  ├─► /login                                              │
│  │   └─► Redirect → /auth/login                         │
│  │                                                       │
│  ├─► /auth/login                                         │
│  │   └─► LoginComponent (No Layout)                     │
│  │                                                       │
│  ├─► /admin                                              │
│  │   ├─► AdminLayoutComponent                           │
│  │   │   ├─► /admin (redirect → /admin/dashboard)       │
│  │   │   ├─► /admin/dashboard → DashboardComponent      │
│  │   │   ├─► /admin/users → DashboardComponent          │
│  │   │   ├─► /admin/branches → DashboardComponent       │
│  │   │   ├─► /admin/roles → DashboardComponent          │
│  │   │   ├─► /admin/loans → DashboardComponent          │
│  │   │   ├─► /admin/history → DashboardComponent        │
│  │   │   └─► /admin/plafond → DashboardComponent        │
│  │                                                       │
│  └─► /** (wildcard)                                      │
│      └─► Redirect → /                                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

### 2.3 Route Properties Explained

```typescript
{
    path: 'admin',                    // URL segment
    component: AdminLayoutComponent,  // Component to render
    children: [...],                  // Nested routes
    redirectTo: '/login',             // Redirect target
    pathMatch: 'full',                // Match strategy
    canActivate: [AuthGuard],         // Route guards
    data: { title: 'Admin' },         // Custom data
    loadChildren: () => import('...')  // Lazy loading
}
```

**Property Details:**

| Property       | Type               | Description                                |
| -------------- | ------------------ | ------------------------------------------ |
| `path`         | string             | URL pattern (tanpa leading slash)          |
| `component`    | Component          | Component yang akan di-render              |
| `children`     | Routes[]           | Child routes (nested)                      |
| `redirectTo`   | string             | URL tujuan redirect                        |
| `pathMatch`    | 'full' \| 'prefix' | Strategy matching URL                      |
| `canActivate`  | Guard[]            | Guards untuk protect route                 |
| `data`         | any                | Data static yang bisa diakses di component |
| `loadChildren` | Function           | Lazy load module/routes                    |

---

## 3. NESTED ROUTES (PARENT-CHILD)

### 3.1 Konsep Parent-Child Routes

Nested routes memungkinkan struktur URL hierarkis dengan layout bertingkat.

```
Parent Route:  /admin
├─ Child Route: /admin/dashboard
├─ Child Route: /admin/users
└─ Child Route: /admin/branches
```

**Visual Flow:**

```
URL: /admin/dashboard

Step 1: Match parent route '/admin'
        ↓
Step 2: Render AdminLayoutComponent
        ┌──────────────────────────────┐
        │  AdminLayoutComponent        │
        │  ┌────────┐  ┌────────────┐ │
        │  │Sidebar │  │   Header   │ │
        │  └────────┘  └────────────┘ │
        │                              │
        │  ┌──────────────────────┐   │
        │  │  <router-outlet>     │   │◄── Step 3: Match child route
        │  │                      │   │    '/dashboard'
        │  │  DashboardComponent  │   │
        │  │    renders here      │   │
        │  └──────────────────────┘   │
        │                              │
        │  ┌────────────────────────┐ │
        │  │       Footer           │ │
        │  └────────────────────────┘ │
        └──────────────────────────────┘
```

---

### 3.2 Implementasi Nested Routes

#### A. Parent Route Configuration

```typescript
{
    path: 'admin',                    // Parent path
    component: AdminLayoutComponent,   // Parent component
    children: [                       // Child routes array
        { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        { path: 'dashboard', component: DashboardComponent },
        { path: 'users', component: UsersComponent }
    ]
}
```

#### B. Parent Component Template

```typescript
// admin-layout.component.ts
@Component({
  selector: 'app-admin-layout',
  template: `
    <app-admin-sidebar></app-admin-sidebar>

    <div class="main-wrapper">
      <app-admin-header></app-admin-header>

      <main>
        <!-- Child route renders here -->
        <router-outlet></router-outlet>
      </main>

      <app-admin-footer></app-admin-footer>
    </div>
  `,
})
export class AdminLayoutComponent {}
```

**Penting:** Parent component HARUS memiliki `<router-outlet>` untuk render child routes.

---

### 3.3 Multiple Router Outlets (Named Outlets)

Angular mendukung multiple outlets dengan nama:

```typescript
// Routes
{
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
        { path: 'dashboard', component: DashboardComponent },
        {
            path: 'users',
            component: UsersComponent,
            outlet: 'sidebar' // Named outlet
        }
    ]
}

// Template
<router-outlet></router-outlet>           <!-- Primary outlet -->
<router-outlet name="sidebar"></router-outlet>  <!-- Named outlet -->

// Navigation
this.router.navigate([{outlets: {sidebar: ['users']}}]);
```

**URL Result:** `/admin/dashboard(sidebar:users)`

---

## 4. LAYOUT-BASED ROUTING

### 4.1 Konsep Layout Pattern

Layout-based routing adalah pattern dimana setiap area aplikasi punya layout sendiri:

```
Public Area   → MainLayout     (Navbar + Footer)
Auth Area     → No Layout      (Full page login)
Admin Area    → AdminLayout    (Sidebar + Header + Footer)
```

---

### 4.2 Implementation Details

#### A. MainLayout (Public Area)

**Route:**

```typescript
{
    path: '',
    component: MainLayoutComponent,
    children: [
        { path: '', component: LandingPageComponent },
        { path: 'about', component: AboutComponent },
        { path: 'contact', component: ContactComponent }
    ]
}
```

**Component:**

```typescript
@Component({
  selector: 'app-main-layout',
  template: `
    <app-navbar></app-navbar>
    <main>
      <router-outlet></router-outlet>
    </main>
    <app-footer></app-footer>
  `,
})
export class MainLayoutComponent {}
```

**Visual:**

```
┌─────────────────────────────────┐
│          Navbar                 │
├─────────────────────────────────┤
│                                 │
│      <router-outlet>            │
│      LandingPageComponent       │
│                                 │
├─────────────────────────────────┤
│          Footer                 │
└─────────────────────────────────┘
```

---

#### B. AdminLayout (Protected Area)

**Route:**

```typescript
{
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
        { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        { path: 'dashboard', component: DashboardComponent },
        { path: 'users', component: UsersComponent }
    ]
}
```

**Component:**

```typescript
@Component({
  selector: 'app-admin-layout',
  template: `
    <div class="admin-container">
      <app-admin-sidebar></app-admin-sidebar>

      <div class="content-wrapper">
        <app-admin-header></app-admin-header>

        <main>
          <router-outlet></router-outlet>
        </main>

        <app-admin-footer></app-admin-footer>
      </div>
    </div>
  `,
})
export class AdminLayoutComponent {}
```

**Visual:**

```
┌────────┬──────────────────────────┐
│        │       Header             │
│ Side   ├──────────────────────────┤
│ bar    │                          │
│        │   <router-outlet>        │
│        │   DashboardComponent     │
│        │                          │
│        ├──────────────────────────┤
│        │       Footer             │
└────────┴──────────────────────────┘
```

---

#### C. No Layout (Auth Pages)

**Route:**

```typescript
{ path: 'auth/login', component: LoginComponent }
```

**Component:**

```typescript
@Component({
  selector: 'app-login',
  template: `
    <div class="login-page-fullscreen">
      <!-- Full page login form -->
    </div>
  `,
})
export class LoginComponent {}
```

**Visual:**

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│        Login Form               │
│        (Full Page)              │
│                                 │
│                                 │
└─────────────────────────────────┘
```

---

### 4.3 Kenapa Pakai Layout Pattern?

**Keuntungan:**

1. **Separation of Concerns:**

   ```
   Layout Logic  → Layout Component
   Page Content  → Feature Component
   ```

2. **Reusability:**

   ```typescript
   // Same layout for multiple pages
   AdminLayout
   ├─ Dashboard
   ├─ Users
   ├─ Settings
   └─ Reports
   ```

3. **Easy Maintenance:**

   ```typescript
   // Change header? Edit AdminLayoutComponent only
   // All admin pages automatically updated
   ```

4. **Different Layouts for Different Areas:**
   ```typescript
   Public:  Navbar + Content + Footer
   Auth:    Fullscreen forms
   Admin:   Sidebar + Header + Content + Footer
   ```

---

## 5. REDIRECT STRATEGY

### 5.1 Basic Redirect

```typescript
{
    path: 'old-url',
    redirectTo: 'new-url',
    pathMatch: 'full'
}
```

**Example:**

```typescript
{ path: 'login', redirectTo: 'auth/login', pathMatch: 'full' }
```

**Flow:**

```
User navigates to: /login
        ↓
Router matches: { path: 'login' }
        ↓
Router redirects to: /auth/login
        ↓
Router matches: { path: 'auth/login' }
        ↓
Render: LoginComponent
```

---

### 5.2 pathMatch: 'full' vs 'prefix'

#### A. pathMatch: 'full'

URL harus exact match (tidak boleh ada segment tambahan).

```typescript
{ path: 'admin', redirectTo: 'admin/dashboard', pathMatch: 'full' }
```

**Test Cases:**

```
/admin           → ✅ MATCH → Redirect
/admin/users     → ❌ NO MATCH → Not redirected
/admin/dashboard → ❌ NO MATCH → Not redirected
```

---

#### B. pathMatch: 'prefix'

URL boleh partial match (default behavior).

```typescript
{ path: 'admin', redirectTo: 'admin/dashboard', pathMatch: 'prefix' }
```

**Test Cases:**

```
/admin           → ✅ MATCH → Redirect
/admin/users     → ✅ MATCH → Redirect (DANGER!)
/admin/dashboard → ✅ MATCH → Redirect (DANGER!)
```

**⚠️ WARNING:** Jangan pakai 'prefix' untuk redirect, bisa infinite loop!

---

### 5.3 Conditional Redirect (With Guards)

Redirect berdasarkan kondisi:

```typescript
{
    path: 'admin',
    canActivate: [AuthGuard],
    component: AdminLayoutComponent,
    children: [...]
}

// AuthGuard
export const AuthGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true; // Allow access
    }

    // Redirect to login
    router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url }
    });
    return false;
};
```

**Flow:**

```
User navigates to: /admin/dashboard
        ↓
AuthGuard checks: isAuthenticated()
        ├─► TRUE  → Allow access
        └─► FALSE → Redirect to /auth/login?returnUrl=/admin/dashboard
```

---

### 5.4 Default Child Route

```typescript
{
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
        { path: '', redirectTo: 'dashboard', pathMatch: 'full' }, // Default
        { path: 'dashboard', component: DashboardComponent },
        { path: 'users', component: UsersComponent }
    ]
}
```

**Behavior:**

```
/admin           → Redirect → /admin/dashboard
/admin/dashboard → Render DashboardComponent
/admin/users     → Render UsersComponent
```

---

### 5.5 Wildcard Route (404 Handler)

```typescript
{ path: '**', redirectTo: '' }
// or
{ path: '**', component: NotFoundComponent }
```

**⚠️ IMPORTANT:** Wildcard route HARUS di paling bawah!

```typescript
// ✅ CORRECT
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: '**', redirectTo: '' }, // Last route
];

// ❌ WRONG
export const routes: Routes = [
  { path: '**', redirectTo: '' }, // Catches everything!
  { path: '', component: HomeComponent }, // Never reached
  { path: 'about', component: AboutComponent }, // Never reached
];
```

---

## 6. ROUTER OUTLET

### 6.1 Apa itu Router Outlet?

**RouterOutlet** adalah directive yang bertindak sebagai placeholder untuk render component berdasarkan active route.

```html
<router-outlet></router-outlet>
```

**Visual:**

```
Before Navigation:
┌────────────────────┐
│ <router-outlet>    │  ← Empty
└────────────────────┘

After Navigate to /dashboard:
┌────────────────────┐
│ <router-outlet>    │
│   ┌────────────┐   │
│   │ Dashboard  │   │  ← Component inserted
│   │ Component  │   │
│   └────────────┘   │
└────────────────────┘
```

---

### 6.2 Primary vs Named Outlets

#### A. Primary Outlet (Default)

```html
<router-outlet></router-outlet>
```

#### B. Named Outlet

```html
<router-outlet name="sidebar"></router-outlet> <router-outlet name="popup"></router-outlet>
```

**Route Configuration:**

```typescript
{
    path: 'dashboard',
    component: DashboardComponent,
    children: [
        { path: 'detail', component: DetailComponent },
        { path: 'sidebar', component: SidebarComponent, outlet: 'sidebar' },
        { path: 'popup', component: PopupComponent, outlet: 'popup' }
    ]
}
```

**Navigation:**

```typescript
// Navigate to primary
this.router.navigate(['/dashboard/detail']);

// Navigate to named outlet
this.router.navigate(['/dashboard', { outlets: { sidebar: ['sidebar'] } }]);

// Navigate to multiple outlets
this.router.navigate([
  '/dashboard',
  {
    outlets: {
      primary: ['detail'],
      sidebar: ['sidebar'],
      popup: ['popup'],
    },
  },
]);
```

**Resulting URLs:**

```
Primary:   /dashboard/detail
Named:     /dashboard(sidebar:sidebar)
Multiple:  /dashboard/detail(sidebar:sidebar//popup:popup)
```

---

### 6.3 Router Outlet Events

```typescript
@Component({
  template: `
    <router-outlet (activate)="onActivate($event)" (deactivate)="onDeactivate($event)">
    </router-outlet>
  `,
})
export class AppComponent {
  onActivate(component: any) {
    console.log('Component activated:', component);
  }

  onDeactivate(component: any) {
    console.log('Component deactivated:', component);
  }
}
```

**Use Cases:**

- Track page views
- Reset scroll position
- Clean up resources
- Show/hide loading indicator

---

## 7. NAVIGATION METHODS

### 7.1 Template Navigation (RouterLink)

#### A. Basic RouterLink

```html
<a routerLink="/admin/dashboard">Dashboard</a>
```

#### B. RouterLink with Parameters

```html
<!-- Array syntax -->
<a [routerLink]="['/admin', 'users', userId]">User Profile</a>
<!-- Results: /admin/users/123 -->

<!-- String syntax -->
<a routerLink="/admin/users/{{userId}}">User Profile</a>
```

#### C. RouterLink with Query Params

```html
<a [routerLink]="['/admin/users']" [queryParams]="{page: 1, sort: 'name'}"> Users </a>
<!-- Results: /admin/users?page=1&sort=name -->
```

#### D. RouterLink with Fragment

```html
<a [routerLink]="['/admin/users']" fragment="top"> Jump to Top </a>
<!-- Results: /admin/users#top -->
```

#### E. Relative Navigation

```html
<!-- Current URL: /admin/dashboard -->

<a routerLink="users">Users</a>
<!-- Results: /admin/dashboard/users -->

<a routerLink="../users">Users</a>
<!-- Results: /admin/users -->

<a routerLink="./settings">Settings</a>
<!-- Results: /admin/dashboard/settings -->
```

#### F. RouterLinkActive

```html
<a
  routerLink="/admin/dashboard"
  routerLinkActive="active-link"
  [routerLinkActiveOptions]="{exact: true}"
>
  Dashboard
</a>
```

**CSS:**

```css
.active-link {
  color: blue;
  font-weight: bold;
  border-bottom: 2px solid blue;
}
```

**Options:**

```typescript
{
  exact: false;
} // Default - matches if URL starts with link
{
  exact: true;
} // Must match exactly
```

**Example:**

```html
<!-- Current URL: /admin/dashboard -->

<a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact: false}">
  Admin
</a>
<!-- ✅ Active (URL starts with /admin) -->

<a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
  Admin
</a>
<!-- ❌ Not Active (URL is /admin/dashboard, not exactly /admin) -->
```

---

### 7.2 Programmatic Navigation (Router Service)

#### A. Basic Navigation

```typescript
import { Router } from '@angular/router';

export class MyComponent {
  private router = inject(Router);

  goToDashboard() {
    this.router.navigate(['/admin/dashboard']);
  }
}
```

#### B. Navigation with Parameters

```typescript
// URL Parameters
this.router.navigate(['/admin/users', userId]);
// Results: /admin/users/123

// Query Parameters
this.router.navigate(['/admin/users'], {
  queryParams: { page: 1, sort: 'name' },
});
// Results: /admin/users?page=1&sort=name

// Fragment
this.router.navigate(['/admin/users'], {
  fragment: 'section2',
});
// Results: /admin/users#section2
```

#### C. Relative Navigation

```typescript
import { ActivatedRoute } from '@angular/router';

export class MyComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  goToSibling() {
    // Current: /admin/dashboard
    this.router.navigate(['../users'], { relativeTo: this.route });
    // Results: /admin/users
  }

  goToChild() {
    // Current: /admin/dashboard
    this.router.navigate(['settings'], { relativeTo: this.route });
    // Results: /admin/dashboard/settings
  }
}
```

#### D. Navigation with State

```typescript
// Pass data without showing in URL
this.router.navigate(['/admin/users'], {
  state: {
    message: 'User created successfully',
    data: { id: 123, name: 'John' },
  },
});

// Receive in target component
export class UsersComponent {
  constructor() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state;
    console.log(state?.message); // 'User created successfully'
  }
}
```

#### E. NavigateByUrl

```typescript
// navigate() vs navigateByUrl()

// navigate() - Relative to current route
this.router.navigate(['users']); // Relative

// navigateByUrl() - Absolute URL
this.router.navigateByUrl('/admin/users'); // Absolute
```

#### F. Navigation Options

```typescript
this.router.navigate(['/admin/users'], {
  relativeTo: this.route, // Base route
  queryParams: { page: 1 }, // Query params
  queryParamsHandling: 'merge', // 'merge' | 'preserve' | ''
  fragment: 'top', // URL fragment
  preserveFragment: true, // Keep existing fragment
  skipLocationChange: true, // Don't update URL
  replaceUrl: true, // Replace history instead of push
  state: { data: 'value' }, // Navigation state
});
```

---

### 7.3 Navigation Guards

Prevent/allow navigation berdasarkan kondisi.

#### A. CanActivate (Before Enter)

```typescript
export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true;
    }

    router.navigate(['/auth/login']);
    return false;
};

// Usage
{
    path: 'admin',
    canActivate: [authGuard],
    component: AdminComponent
}
```

#### B. CanDeactivate (Before Leave)

```typescript
export interface CanComponentDeactivate {
    canDeactivate: () => boolean | Observable<boolean>;
}

export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = (component) => {
    return component.canDeactivate ? component.canDeactivate() : true;
};

// Usage
{
    path: 'edit',
    component: EditComponent,
    canDeactivate: [unsavedChangesGuard]
}
```

#### C. CanActivateChild (Child Routes)

```typescript
export const roleGuard: CanActivateChildFn = (childRoute, state) => {
    const authService = inject(AuthService);
    const requiredRole = childRoute.data['role'];

    return authService.hasRole(requiredRole);
};

// Usage
{
    path: 'admin',
    canActivateChild: [roleGuard],
    children: [
        { path: 'users', component: UsersComponent, data: { role: 'admin' } }
    ]
}
```

#### D. Resolve (Data Loading)

```typescript
export const userResolver: ResolveFn<User> = (route, state) => {
    const userService = inject(UserService);
    const userId = route.paramMap.get('id');
    return userService.getUser(userId);
};

// Usage
{
    path: 'users/:id',
    component: UserDetailComponent,
    resolve: { user: userResolver }
}

// Access in component
export class UserDetailComponent {
    private route = inject(ActivatedRoute);

    ngOnInit() {
        this.route.data.subscribe(data => {
            console.log(data['user']); // Resolved user data
        });
    }
}
```

---

## 8. ROUTE PARAMETERS

### 8.1 URL Parameters

#### A. Required Parameters

```typescript
// Route
{ path: 'users/:id', component: UserDetailComponent }

// Navigate
this.router.navigate(['/users', 123]);

// URL: /users/123

// Read in component
export class UserDetailComponent {
    private route = inject(ActivatedRoute);

    ngOnInit() {
        // Snapshot (one-time read)
        const id = this.route.snapshot.paramMap.get('id');
        console.log(id); // '123'

        // Observable (reactive)
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            console.log(id); // Updates when param changes
        });
    }
}
```

#### B. Multiple Parameters

```typescript
// Route
{ path: 'posts/:category/:id', component: PostComponent }

// Navigate
this.router.navigate(['/posts', 'technology', 456]);

// URL: /posts/technology/456

// Read
this.route.paramMap.subscribe(params => {
    const category = params.get('category'); // 'technology'
    const id = params.get('id');             // '456'
});
```

#### C. Optional Parameters

```typescript
// Navigate with optional params
this.router.navigate(['/users', { page: 1, sort: 'name' }]);

// URL: /users;page=1;sort=name (Matrix URL notation)

// Read
this.route.paramMap.subscribe((params) => {
  const page = params.get('page'); // '1'
  const sort = params.get('sort'); // 'name'
});
```

---

### 8.2 Query Parameters

```typescript
// Navigate
this.router.navigate(['/users'], {
  queryParams: { page: 1, filter: 'active', sort: 'name' },
});

// URL: /users?page=1&filter=active&sort=name

// Read
this.route.queryParamMap.subscribe((params) => {
  const page = params.get('page'); // '1'
  const filter = params.get('filter'); // 'active'
  const sort = params.get('sort'); // 'name'
});
```

#### Query Params Handling

```typescript
// Preserve existing query params
this.router.navigate(['/users'], {
  queryParams: { page: 2 },
  queryParamsHandling: 'preserve', // Keep existing params
});

// Merge with existing query params
this.router.navigate(['/users'], {
  queryParams: { filter: 'new' },
  queryParamsHandling: 'merge', // Merge with existing
});
```

---

### 8.3 Route Data

Static data yang bisa diakses di component:

```typescript
// Route
{
    path: 'about',
    component: AboutComponent,
    data: {
        title: 'About Us',
        breadcrumb: 'About',
        requiresAuth: false
    }
}

// Read in component
this.route.data.subscribe(data => {
    console.log(data['title']);      // 'About Us'
    console.log(data['breadcrumb']); // 'About'
});
```

---

## 9. ADVANCED ROUTING PATTERNS

### 9.1 Lazy Loading

Load module hanya ketika dibutuhkan (tidak di initial load).

```typescript
// Eager Loading (Default)
{
    path: 'admin',
    component: AdminComponent
}

// Lazy Loading
{
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES)
}
```

**Benefits:**

- ⚡ Faster initial load
- 📦 Smaller bundle size
- 🚀 Better performance

**Bundle Visualization:**

```
Eager Loading:
main.js (5MB) → Contains everything

Lazy Loading:
main.js (2MB) → Core app
admin.js (1.5MB) → Loaded when accessing /admin
reports.js (1MB) → Loaded when accessing /reports
```

---

### 9.2 Preloading Strategy

```typescript
// app.config.ts
import { PreloadAllModules } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withPreloading(PreloadAllModules) // Preload all lazy modules
    ),
  ],
};
```

**Strategies:**

1. `NoPreloading`: Default - load on demand
2. `PreloadAllModules`: Preload all after initial load
3. Custom strategy: Selective preloading

---

### 9.3 Custom Preloading Strategy

```typescript
export class SelectivePreloadingStrategy implements PreloadingStrategy {
    preload(route: Route, load: () => Observable<any>): Observable<any> {
        // Only preload if route has data.preload = true
        if (route.data && route.data['preload']) {
            console.log('Preloading:', route.path);
            return load();
        }
        return of(null);
    }
}

// Route
{
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes'),
    data: { preload: true } // This will be preloaded
}

{
    path: 'reports',
    loadChildren: () => import('./reports/reports.routes'),
    data: { preload: false } // This won't be preloaded
}
```

---

### 9.4 Route Reuse Strategy

Control apakah component di-reuse atau di-recreate:

```typescript
export class CustomRouteReuseStrategy implements RouteReuseStrategy {
  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return false; // Never detach
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    // Store component
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return false; // Never attach stored component
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    // Reuse if same route config
    return future.routeConfig === curr.routeConfig;
  }
}

// Register
providers: [{ provide: RouteReuseStrategy, useClass: CustomRouteReuseStrategy }];
```

---

## 10. TROUBLESHOOTING

### 10.1 Common Issues

#### Issue 1: "Route not working / 404"

**Symptoms:**

```
Navigate to /admin/dashboard → Shows 404 or blank page
```

**Solutions:**

```typescript
// ✅ Check route configuration
{ path: 'admin/dashboard', component: DashboardComponent }

// ✅ Check component import
import { DashboardComponent } from './dashboard/dashboard.component';

// ✅ Check router outlet exists
<router-outlet></router-outlet>

// ✅ Check wildcard route position (must be last)
{ path: '**', redirectTo: '' }
```

---

#### Issue 2: "Redirect loop / Max call stack"

**Symptoms:**

```
Browser freezes
Console error: Maximum call stack size exceeded
```

**Cause:**

```typescript
// ❌ WRONG - Circular redirect
{ path: 'admin', redirectTo: 'admin', pathMatch: 'full' }

// ❌ WRONG - pathMatch prefix on redirect
{ path: 'admin', redirectTo: 'dashboard', pathMatch: 'prefix' }
```

**Solution:**

```typescript
// ✅ CORRECT
{
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
        { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        { path: 'dashboard', component: DashboardComponent }
    ]
}
```

---

#### Issue 3: "Child route not rendering"

**Symptoms:**

```
/admin/dashboard → AdminLayout renders but DashboardComponent doesn't
```

**Solution:**

```typescript
// ✅ Parent component MUST have router-outlet
@Component({
    template: `
        <app-sidebar></app-sidebar>
        <main>
            <router-outlet></router-outlet>  ← Must exist!
        </main>
    `
})
```

---

#### Issue 4: "RouterLink not working"

**Symptoms:**

```html
<a routerLink="/admin/users">Users</a>
<!-- Clicking does nothing -->
```

**Solutions:**

```typescript
// ✅ Check RouterLink imported
imports: [RouterLink, RouterLinkActive]

// ✅ Check syntax
<a [routerLink]="['/admin', 'users']">Users</a>

// ✅ Prevent default if using (click)
<a routerLink="/users" (click)="doSomething(); $event.preventDefault()">
```

---

#### Issue 5: "Query params not updating"

**Symptoms:**

```typescript
this.router.navigate(['/users'], { queryParams: { page: 2 } });
// URL changes but component doesn't update
```

**Solution:**

```typescript
// ❌ Snapshot (one-time read)
const page = this.route.snapshot.queryParamMap.get('page');

// ✅ Observable (reactive)
this.route.queryParamMap.subscribe((params) => {
  const page = params.get('page');
  this.loadUsers(page);
});
```

---

### 10.2 Debugging Tips

#### A. Router Events

```typescript
export class AppComponent {
  constructor(router: Router) {
    router.events.subscribe((event) => {
      console.log('Router Event:', event);
    });
  }
}
```

**Event Types:**

- `NavigationStart`: Navigation begins
- `RoutesRecognized`: Route matched
- `NavigationEnd`: Navigation complete
- `NavigationError`: Navigation failed
- `NavigationCancel`: Navigation cancelled

#### B. Route Tracing

```typescript
// app.config.ts
provideRouter(
  routes,
  withDebugTracing() // Logs all router events
);
```

#### C. Check Active Route

```typescript
console.log('Current URL:', this.router.url);
console.log('Route config:', this.route.routeConfig);
console.log('Route params:', this.route.snapshot.params);
console.log('Query params:', this.route.snapshot.queryParams);
```

---

### 10.3 Testing Checklist

```
Navigation Tests:
☐ Navigate to each route via URL
☐ Navigate via RouterLink clicks
☐ Navigate via programmatic navigation
☐ Test back/forward browser buttons
☐ Test bookmark/refresh behavior

Layout Tests:
☐ Public routes show MainLayout
☐ Admin routes show AdminLayout
☐ Auth routes show no layout
☐ Nested routes render in correct outlet

Redirect Tests:
☐ Default redirects work (/admin → /admin/dashboard)
☐ Alias redirects work (/login → /auth/login)
☐ Wildcard catches invalid URLs

Guard Tests:
☐ AuthGuard blocks unauthenticated access
☐ RoleGuard blocks unauthorized users
☐ CanDeactivate prevents leaving with unsaved changes

Parameter Tests:
☐ URL params readable
☐ Query params readable
☐ Route data accessible
☐ Navigation state passed correctly
```

---

## 🎯 KESIMPULAN

### Key Takeaways:

1. **Routing adalah jantung SPA:**

   - Navigasi tanpa reload
   - URL-based navigation
   - Browser history support

2. **Nested Routes untuk Layout:**

   - Parent route = Layout
   - Child routes = Content
   - Multiple layouts = Multiple parent routes

3. **RouterOutlet adalah placeholder:**

   - Tempat component di-render
   - Support multiple named outlets
   - Must exist in parent component

4. **Navigation Methods:**

   - Template: `routerLink`
   - Programmatic: `router.navigate()`
   - Both support params, query, fragment

5. **Guards untuk Protection:**
   - CanActivate: Protect route
   - CanDeactivate: Prevent leaving
   - CanActivateChild: Protect children
   - Resolve: Preload data

---

### Route Configuration Summary:

```typescript
export const routes: Routes = [
  // Public area with layout
  {
    path: '',
    component: MainLayoutComponent,
    children: [{ path: '', component: LandingPageComponent }],
  },

  // Auth without layout
  { path: 'auth/login', component: LoginComponent },

  // Protected area with different layout
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      // ... other admin routes
    ],
  },

  // 404 handler
  { path: '**', redirectTo: '' },
];
```

---

## 📖 REFERENSI

- [Angular Router Official Docs](https://angular.io/guide/router)
- [Router API Reference](https://angular.io/api/router)
- [Routing & Navigation Tutorial](https://angular.io/guide/router-tutorial)
- [Route Guards](https://angular.io/guide/router-tutorial-toh#milestone-5-route-guards)
- [Lazy Loading](https://angular.io/guide/lazy-loading-ngmodules)

---

**Created by:** Copilot AI Assistant  
**Date:** January 13, 2026  
**Version:** 1.0.0  
**Project:** Loanova Finance System  
**Focus:** Routing System Deep Dive
