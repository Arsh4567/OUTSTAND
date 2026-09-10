/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is generated from src/routes. Keep it synchronized with the route filesystem.

import { Route as rootRouteImport } from './routes/__root'
import { Route as SitemapDotxmlRouteImport } from './routes/sitemap[.]xml'
import { Route as AuthRouteImport } from './routes/auth'
import { Route as AuthCallbackRouteImport } from './routes/auth/callback'
import { Route as AuthenticatedRouteRouteImport } from './routes/_authenticated/route'
import { Route as IndexRouteImport } from './routes/index'
import { Route as RoadmapRouteImport } from './routes/roadmap'
import { Route as ComebackRouteImport } from './routes/comeback'
import { Route as ApiChatRouteImport } from './routes/api/chat'
import { Route as ApiRoadmapRouteImport } from './routes/api/roadmap'
import { Route as AuthenticatedProfileRouteImport } from './routes/_authenticated/profile'
import { Route as AuthenticatedOutstandRouteImport } from './routes/_authenticated/outstand'
import { Route as AuthenticatedFocusRouteImport } from './routes/_authenticated/focus'
import { Route as AuthenticatedDopamineRouteImport } from './routes/_authenticated/dopamine'
import { Route as AuthenticatedDashboardRouteImport } from './routes/_authenticated/dashboard'
import { Route as AuthenticatedChatRouteImport } from './routes/_authenticated/chat'
import { Route as AuthenticatedFriendsRouteImport } from './routes/_authenticated/friends'
import { Route as AuthenticatedIntelligenceRouteImport } from './routes/_authenticated/intelligence'
import { Route as AuthenticatedLeagueRouteImport } from './routes/_authenticated/league'
import { Route as AuthenticatedNotificationsRouteImport } from './routes/_authenticated/notifications'
import { Route as AuthenticatedOnboardingRouteImport } from './routes/_authenticated/onboarding'
import { Route as AuthenticatedHabitsRouteImport } from './routes/_authenticated/habits'
import { Route as AuthenticatedUserProfileRouteImport } from './routes/_authenticated/user-profile'

const SitemapDotxmlRoute = SitemapDotxmlRouteImport.update({ id: '/sitemap.xml', path: '/sitemap.xml', getParentRoute: () => rootRouteImport } as any)
const AuthRoute = AuthRouteImport.update({ id: '/auth', path: '/auth', getParentRoute: () => rootRouteImport } as any)
const AuthCallbackRoute = AuthCallbackRouteImport.update({ id: '/callback', path: '/callback', getParentRoute: () => AuthRoute } as any)
const AuthenticatedRouteRoute = AuthenticatedRouteRouteImport.update({ id: '/_authenticated', getParentRoute: () => rootRouteImport } as any)
const IndexRoute = IndexRouteImport.update({ id: '/', path: '/', getParentRoute: () => rootRouteImport } as any)
const RoadmapRoute = RoadmapRouteImport.update({ id: '/roadmap', path: '/roadmap', getParentRoute: () => rootRouteImport } as any)
const ComebackRoute = ComebackRouteImport.update({ id: '/comeback', path: '/comeback', getParentRoute: () => rootRouteImport } as any)
const ApiChatRoute = ApiChatRouteImport.update({ id: '/api/chat', path: '/api/chat', getParentRoute: () => rootRouteImport } as any)
const ApiRoadmapRoute = ApiRoadmapRouteImport.update({ id: '/api/roadmap', path: '/api/roadmap', getParentRoute: () => rootRouteImport } as any)
const AuthenticatedProfileRoute = AuthenticatedProfileRouteImport.update({ id: '/profile', path: '/profile', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedOutstandRoute = AuthenticatedOutstandRouteImport.update({ id: '/outstand', path: '/outstand', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedFocusRoute = AuthenticatedFocusRouteImport.update({ id: '/focus', path: '/focus', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedDopamineRoute = AuthenticatedDopamineRouteImport.update({ id: '/dopamine', path: '/dopamine', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedDashboardRoute = AuthenticatedDashboardRouteImport.update({ id: '/dashboard', path: '/dashboard', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedChatRoute = AuthenticatedChatRouteImport.update({ id: '/chat', path: '/chat', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedFriendsRoute = AuthenticatedFriendsRouteImport.update({ id: '/friends', path: '/friends', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedIntelligenceRoute = AuthenticatedIntelligenceRouteImport.update({ id: '/intelligence', path: '/intelligence', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedLeagueRoute = AuthenticatedLeagueRouteImport.update({ id: '/league', path: '/league', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedNotificationsRoute = AuthenticatedNotificationsRouteImport.update({ id: '/notifications', path: '/notifications', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedOnboardingRoute = AuthenticatedOnboardingRouteImport.update({ id: '/onboarding', path: '/onboarding', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedHabitsRoute = AuthenticatedHabitsRouteImport.update({ id: '/habits', path: '/habits', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedUserProfileRoute = AuthenticatedUserProfileRouteImport.update({ id: '/user-profile', path: '/user-profile', getParentRoute: () => AuthenticatedRouteRoute } as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/auth': typeof AuthRoute
  '/auth/callback': typeof AuthCallbackRoute
  '/sitemap.xml': typeof SitemapDotxmlRoute
  '/roadmap': typeof RoadmapRoute
  '/comeback': typeof ComebackRoute
  '/api/chat': typeof ApiChatRoute
  '/api/roadmap': typeof ApiRoadmapRoute
  '/chat': typeof AuthenticatedChatRoute
  '/dashboard': typeof AuthenticatedDashboardRoute
  '/dopamine': typeof AuthenticatedDopamineRoute
  '/focus': typeof AuthenticatedFocusRoute
  '/friends': typeof AuthenticatedFriendsRoute
  '/habits': typeof AuthenticatedHabitsRoute
  '/intelligence': typeof AuthenticatedIntelligenceRoute
  '/league': typeof AuthenticatedLeagueRoute
  '/notifications': typeof AuthenticatedNotificationsRoute
  '/onboarding': typeof AuthenticatedOnboardingRoute
  '/outstand': typeof AuthenticatedOutstandRoute
  '/profile': typeof AuthenticatedProfileRoute
  '/user-profile': typeof AuthenticatedUserProfileRoute
}
export interface FileRoutesByTo extends FileRoutesByFullPath {}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/auth': typeof AuthRouteWithChildren
  '/auth/callback': typeof AuthCallbackRoute
  '/_authenticated': typeof AuthenticatedRouteRouteWithChildren
  '/sitemap.xml': typeof SitemapDotxmlRoute
  '/roadmap': typeof RoadmapRoute
  '/comeback': typeof ComebackRoute
  '/api/chat': typeof ApiChatRoute
  '/api/roadmap': typeof ApiRoadmapRoute
  '/_authenticated/chat': typeof AuthenticatedChatRoute
  '/_authenticated/dashboard': typeof AuthenticatedDashboardRoute
  '/_authenticated/dopamine': typeof AuthenticatedDopamineRoute
  '/_authenticated/focus': typeof AuthenticatedFocusRoute
  '/_authenticated/friends': typeof AuthenticatedFriendsRoute
  '/_authenticated/habits': typeof AuthenticatedHabitsRoute
  '/_authenticated/intelligence': typeof AuthenticatedIntelligenceRoute
  '/_authenticated/league': typeof AuthenticatedLeagueRoute
  '/_authenticated/notifications': typeof AuthenticatedNotificationsRoute
  '/_authenticated/onboarding': typeof AuthenticatedOnboardingRoute
  '/_authenticated/outstand': typeof AuthenticatedOutstandRoute
  '/_authenticated/profile': typeof AuthenticatedProfileRoute
  '/_authenticated/user-profile': typeof AuthenticatedUserProfileRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: keyof FileRoutesByFullPath
  fileRoutesByTo: FileRoutesByTo
  to: keyof FileRoutesByTo
  id: keyof FileRoutesById
  fileRoutesById: FileRoutesById
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/sitemap.xml': { id: '/sitemap.xml'; path: '/sitemap.xml'; fullPath: '/sitemap.xml'; preLoaderRoute: typeof SitemapDotxmlRouteImport; parentRoute: typeof rootRouteImport }
    '/auth': { id: '/auth'; path: '/auth'; fullPath: '/auth'; preLoaderRoute: typeof AuthRouteImport; parentRoute: typeof rootRouteImport }
    '/auth/callback': { id: '/auth/callback'; path: '/callback'; fullPath: '/auth/callback'; preLoaderRoute: typeof AuthCallbackRouteImport; parentRoute: typeof AuthRoute }
    '/_authenticated': { id: '/_authenticated'; path: ''; fullPath: '/'; preLoaderRoute: typeof AuthenticatedRouteRouteImport; parentRoute: typeof rootRouteImport }
    '/': { id: '/'; path: '/'; fullPath: '/'; preLoaderRoute: typeof IndexRouteImport; parentRoute: typeof rootRouteImport }
    '/roadmap': { id: '/roadmap'; path: '/roadmap'; fullPath: '/roadmap'; preLoaderRoute: typeof RoadmapRouteImport; parentRoute: typeof rootRouteImport }
    '/comeback': { id: '/comeback'; path: '/comeback'; fullPath: '/comeback'; preLoaderRoute: typeof ComebackRouteImport; parentRoute: typeof rootRouteImport }
    '/api/chat': { id: '/api/chat'; path: '/api/chat'; fullPath: '/api/chat'; preLoaderRoute: typeof ApiChatRouteImport; parentRoute: typeof rootRouteImport }
    '/api/roadmap': { id: '/api/roadmap'; path: '/api/roadmap'; fullPath: '/api/roadmap'; preLoaderRoute: typeof ApiRoadmapRouteImport; parentRoute: typeof rootRouteImport }
    '/_authenticated/chat': { id: '/_authenticated/chat'; path: '/chat'; fullPath: '/chat'; preLoaderRoute: typeof AuthenticatedChatRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/dashboard': { id: '/_authenticated/dashboard'; path: '/dashboard'; fullPath: '/dashboard'; preLoaderRoute: typeof AuthenticatedDashboardRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/dopamine': { id: '/_authenticated/dopamine'; path: '/dopamine'; fullPath: '/dopamine'; preLoaderRoute: typeof AuthenticatedDopamineRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/focus': { id: '/_authenticated/focus'; path: '/focus'; fullPath: '/focus'; preLoaderRoute: typeof AuthenticatedFocusRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/friends': { id: '/_authenticated/friends'; path: '/friends'; fullPath: '/friends'; preLoaderRoute: typeof AuthenticatedFriendsRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/habits': { id: '/_authenticated/habits'; path: '/habits'; fullPath: '/habits'; preLoaderRoute: typeof AuthenticatedHabitsRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/intelligence': { id: '/_authenticated/intelligence'; path: '/intelligence'; fullPath: '/intelligence'; preLoaderRoute: typeof AuthenticatedIntelligenceRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/league': { id: '/_authenticated/league'; path: '/league'; fullPath: '/league'; preLoaderRoute: typeof AuthenticatedLeagueRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/notifications': { id: '/_authenticated/notifications'; path: '/notifications'; fullPath: '/notifications'; preLoaderRoute: typeof AuthenticatedNotificationsRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/onboarding': { id: '/_authenticated/onboarding'; path: '/onboarding'; fullPath: '/onboarding'; preLoaderRoute: typeof AuthenticatedOnboardingRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/outstand': { id: '/_authenticated/outstand'; path: '/outstand'; fullPath: '/outstand'; preLoaderRoute: typeof AuthenticatedOutstandRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/profile': { id: '/_authenticated/profile'; path: '/profile'; fullPath: '/profile'; preLoaderRoute: typeof AuthenticatedProfileRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
    '/_authenticated/user-profile': { id: '/_authenticated/user-profile'; path: '/user-profile'; fullPath: '/user-profile'; preLoaderRoute: typeof AuthenticatedUserProfileRouteImport; parentRoute: typeof AuthenticatedRouteRoute }
  }
}

interface AuthRouteChildren { AuthCallbackRoute: typeof AuthCallbackRoute }
const AuthRouteChildren: AuthRouteChildren = { AuthCallbackRoute }
const AuthRouteWithChildren = AuthRoute._addFileChildren(AuthRouteChildren)

interface AuthenticatedRouteRouteChildren {
  AuthenticatedChatRoute: typeof AuthenticatedChatRoute
  AuthenticatedDashboardRoute: typeof AuthenticatedDashboardRoute
  AuthenticatedDopamineRoute: typeof AuthenticatedDopamineRoute
  AuthenticatedFocusRoute: typeof AuthenticatedFocusRoute
  AuthenticatedFriendsRoute: typeof AuthenticatedFriendsRoute
  AuthenticatedHabitsRoute: typeof AuthenticatedHabitsRoute
  AuthenticatedIntelligenceRoute: typeof AuthenticatedIntelligenceRoute
  AuthenticatedLeagueRoute: typeof AuthenticatedLeagueRoute
  AuthenticatedNotificationsRoute: typeof AuthenticatedNotificationsRoute
  AuthenticatedOnboardingRoute: typeof AuthenticatedOnboardingRoute
  AuthenticatedOutstandRoute: typeof AuthenticatedOutstandRoute
  AuthenticatedProfileRoute: typeof AuthenticatedProfileRoute
  AuthenticatedUserProfileRoute: typeof AuthenticatedUserProfileRoute
}
const AuthenticatedRouteRouteChildren: AuthenticatedRouteRouteChildren = {
  AuthenticatedChatRoute,
  AuthenticatedDashboardRoute,
  AuthenticatedDopamineRoute,
  AuthenticatedFocusRoute,
  AuthenticatedFriendsRoute,
  AuthenticatedHabitsRoute,
  AuthenticatedIntelligenceRoute,
  AuthenticatedLeagueRoute,
  AuthenticatedNotificationsRoute,
  AuthenticatedOnboardingRoute,
  AuthenticatedOutstandRoute,
  AuthenticatedProfileRoute,
  AuthenticatedUserProfileRoute,
}
const AuthenticatedRouteRouteWithChildren = AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren)

interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  AuthenticatedRouteRoute: typeof AuthenticatedRouteRouteWithChildren
  AuthRoute: typeof AuthRouteWithChildren
  SitemapDotxmlRoute: typeof SitemapDotxmlRoute
  RoadmapRoute: typeof RoadmapRoute
  ComebackRoute: typeof ComebackRoute
  ApiChatRoute: typeof ApiChatRoute
  ApiRoadmapRoute: typeof ApiRoadmapRoute
}
const rootRouteChildren: RootRouteChildren = {
  IndexRoute,
  AuthenticatedRouteRoute: AuthenticatedRouteRouteWithChildren,
  AuthRoute: AuthRouteWithChildren,
  SitemapDotxmlRoute,
  RoadmapRoute,
  ComebackRoute,
  ApiChatRoute,
  ApiRoadmapRoute,
}
export const routeTree = rootRouteImport._addFileChildren(rootRouteChildren)._addFileTypes<FileRouteTypes>()
