/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as LoginImport } from './routes/login'
import { Route as DashboardRouteImport } from './routes/dashboard/route'
import { Route as DashboardIndexImport } from './routes/dashboard/index'
import { Route as DashboardRecordsImport } from './routes/dashboard/records'
import { Route as DashboardHomeImport } from './routes/dashboard/home'
import { Route as DashboardAnalyticsImport } from './routes/dashboard/analytics'
import { Route as DashboardAccountsImport } from './routes/dashboard/accounts'

// Create Virtual Routes

const SignupLazyImport = createFileRoute('/signup')()
const IndexLazyImport = createFileRoute('/')()

// Create/Update Routes

const SignupLazyRoute = SignupLazyImport.update({
  id: '/signup',
  path: '/signup',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/signup.lazy').then((d) => d.Route))

const LoginRoute = LoginImport.update({
  id: '/login',
  path: '/login',
  getParentRoute: () => rootRoute,
} as any)

const DashboardRouteRoute = DashboardRouteImport.update({
  id: '/dashboard',
  path: '/dashboard',
  getParentRoute: () => rootRoute,
} as any)

const IndexLazyRoute = IndexLazyImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/index.lazy').then((d) => d.Route))

const DashboardIndexRoute = DashboardIndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => DashboardRouteRoute,
} as any)

const DashboardRecordsRoute = DashboardRecordsImport.update({
  id: '/records',
  path: '/records',
  getParentRoute: () => DashboardRouteRoute,
} as any)

const DashboardHomeRoute = DashboardHomeImport.update({
  id: '/home',
  path: '/home',
  getParentRoute: () => DashboardRouteRoute,
} as any)

const DashboardAnalyticsRoute = DashboardAnalyticsImport.update({
  id: '/analytics',
  path: '/analytics',
  getParentRoute: () => DashboardRouteRoute,
} as any)

const DashboardAccountsRoute = DashboardAccountsImport.update({
  id: '/accounts',
  path: '/accounts',
  getParentRoute: () => DashboardRouteRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/dashboard': {
      id: '/dashboard'
      path: '/dashboard'
      fullPath: '/dashboard'
      preLoaderRoute: typeof DashboardRouteImport
      parentRoute: typeof rootRoute
    }
    '/login': {
      id: '/login'
      path: '/login'
      fullPath: '/login'
      preLoaderRoute: typeof LoginImport
      parentRoute: typeof rootRoute
    }
    '/signup': {
      id: '/signup'
      path: '/signup'
      fullPath: '/signup'
      preLoaderRoute: typeof SignupLazyImport
      parentRoute: typeof rootRoute
    }
    '/dashboard/accounts': {
      id: '/dashboard/accounts'
      path: '/accounts'
      fullPath: '/dashboard/accounts'
      preLoaderRoute: typeof DashboardAccountsImport
      parentRoute: typeof DashboardRouteImport
    }
    '/dashboard/analytics': {
      id: '/dashboard/analytics'
      path: '/analytics'
      fullPath: '/dashboard/analytics'
      preLoaderRoute: typeof DashboardAnalyticsImport
      parentRoute: typeof DashboardRouteImport
    }
    '/dashboard/home': {
      id: '/dashboard/home'
      path: '/home'
      fullPath: '/dashboard/home'
      preLoaderRoute: typeof DashboardHomeImport
      parentRoute: typeof DashboardRouteImport
    }
    '/dashboard/records': {
      id: '/dashboard/records'
      path: '/records'
      fullPath: '/dashboard/records'
      preLoaderRoute: typeof DashboardRecordsImport
      parentRoute: typeof DashboardRouteImport
    }
    '/dashboard/': {
      id: '/dashboard/'
      path: '/'
      fullPath: '/dashboard/'
      preLoaderRoute: typeof DashboardIndexImport
      parentRoute: typeof DashboardRouteImport
    }
  }
}

// Create and export the route tree

interface DashboardRouteRouteChildren {
  DashboardAccountsRoute: typeof DashboardAccountsRoute
  DashboardAnalyticsRoute: typeof DashboardAnalyticsRoute
  DashboardHomeRoute: typeof DashboardHomeRoute
  DashboardRecordsRoute: typeof DashboardRecordsRoute
  DashboardIndexRoute: typeof DashboardIndexRoute
}

const DashboardRouteRouteChildren: DashboardRouteRouteChildren = {
  DashboardAccountsRoute: DashboardAccountsRoute,
  DashboardAnalyticsRoute: DashboardAnalyticsRoute,
  DashboardHomeRoute: DashboardHomeRoute,
  DashboardRecordsRoute: DashboardRecordsRoute,
  DashboardIndexRoute: DashboardIndexRoute,
}

const DashboardRouteRouteWithChildren = DashboardRouteRoute._addFileChildren(
  DashboardRouteRouteChildren,
)

export interface FileRoutesByFullPath {
  '/': typeof IndexLazyRoute
  '/dashboard': typeof DashboardRouteRouteWithChildren
  '/login': typeof LoginRoute
  '/signup': typeof SignupLazyRoute
  '/dashboard/accounts': typeof DashboardAccountsRoute
  '/dashboard/analytics': typeof DashboardAnalyticsRoute
  '/dashboard/home': typeof DashboardHomeRoute
  '/dashboard/records': typeof DashboardRecordsRoute
  '/dashboard/': typeof DashboardIndexRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexLazyRoute
  '/login': typeof LoginRoute
  '/signup': typeof SignupLazyRoute
  '/dashboard/accounts': typeof DashboardAccountsRoute
  '/dashboard/analytics': typeof DashboardAnalyticsRoute
  '/dashboard/home': typeof DashboardHomeRoute
  '/dashboard/records': typeof DashboardRecordsRoute
  '/dashboard': typeof DashboardIndexRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexLazyRoute
  '/dashboard': typeof DashboardRouteRouteWithChildren
  '/login': typeof LoginRoute
  '/signup': typeof SignupLazyRoute
  '/dashboard/accounts': typeof DashboardAccountsRoute
  '/dashboard/analytics': typeof DashboardAnalyticsRoute
  '/dashboard/home': typeof DashboardHomeRoute
  '/dashboard/records': typeof DashboardRecordsRoute
  '/dashboard/': typeof DashboardIndexRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | '/dashboard'
    | '/login'
    | '/signup'
    | '/dashboard/accounts'
    | '/dashboard/analytics'
    | '/dashboard/home'
    | '/dashboard/records'
    | '/dashboard/'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | '/login'
    | '/signup'
    | '/dashboard/accounts'
    | '/dashboard/analytics'
    | '/dashboard/home'
    | '/dashboard/records'
    | '/dashboard'
  id:
    | '__root__'
    | '/'
    | '/dashboard'
    | '/login'
    | '/signup'
    | '/dashboard/accounts'
    | '/dashboard/analytics'
    | '/dashboard/home'
    | '/dashboard/records'
    | '/dashboard/'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexLazyRoute: typeof IndexLazyRoute
  DashboardRouteRoute: typeof DashboardRouteRouteWithChildren
  LoginRoute: typeof LoginRoute
  SignupLazyRoute: typeof SignupLazyRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexLazyRoute: IndexLazyRoute,
  DashboardRouteRoute: DashboardRouteRouteWithChildren,
  LoginRoute: LoginRoute,
  SignupLazyRoute: SignupLazyRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/dashboard",
        "/login",
        "/signup"
      ]
    },
    "/": {
      "filePath": "index.lazy.tsx"
    },
    "/dashboard": {
      "filePath": "dashboard/route.tsx",
      "children": [
        "/dashboard/accounts",
        "/dashboard/analytics",
        "/dashboard/home",
        "/dashboard/records",
        "/dashboard/"
      ]
    },
    "/login": {
      "filePath": "login.tsx"
    },
    "/signup": {
      "filePath": "signup.lazy.tsx"
    },
    "/dashboard/accounts": {
      "filePath": "dashboard/accounts.tsx",
      "parent": "/dashboard"
    },
    "/dashboard/analytics": {
      "filePath": "dashboard/analytics.tsx",
      "parent": "/dashboard"
    },
    "/dashboard/home": {
      "filePath": "dashboard/home.tsx",
      "parent": "/dashboard"
    },
    "/dashboard/records": {
      "filePath": "dashboard/records.tsx",
      "parent": "/dashboard"
    },
    "/dashboard/": {
      "filePath": "dashboard/index.tsx",
      "parent": "/dashboard"
    }
  }
}
ROUTE_MANIFEST_END */