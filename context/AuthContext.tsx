'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { AuthUser, OnboardingDraft, StunterProfile } from '@/types';
import { mergePrimaryAndSecondary } from '@/constants/positions';
import { id, now, seedMedia, IMG_COED_STUNT_TIKTOK, IMG_ATHLETICS_DEMO } from '@/data/mockData';

/** In-memory auth today; replace this provider with Firebase Auth later, same API for screens. */

interface AuthContextValue {
  user: AuthUser | null;
  onboardingComplete: boolean;
  signUp: (email: string, password: string) => Promise<{ onboardingComplete: boolean }>;
  login: (email: string, password: string) => Promise<{ onboardingComplete: boolean }>;
  logout: () => void;
  completeOnboarding: (draft: OnboardingDraft) => void;
  updateProfile: (partial: Partial<StunterProfile>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function createProfileFromDraft(uid: string, email: string, draft: OnboardingDraft): StunterProfile {
  const primary = draft.primaryRole ?? 'coed-flyer';
  const positions = mergePrimaryAndSecondary(draft.primaryRole, draft.secondaryRoles);
  const finalPositions = positions.length > 0 ? positions : [primary];

  return {
    id: uid,
    email,
    displayName: draft.displayName || 'Stunter',
    birthday: draft.birthday,
    primaryRole: primary,
    secondaryRoles: draft.secondaryRoles.filter((p) => p !== primary),
    positions: finalPositions,
    skillLevel: draft.skillLevel,
    yearsExperience: draft.yearsExperience,
    availability: draft.availability,
    skillTags: draft.skillTags,
    currentlyWorkingOn: draft.currentlyWorkingOn,
    instagramHandle: draft.instagramHandle,
    media: draft.media,
    location: draft.location,
    teamGym: draft.teamGym,
    bio: draft.bio,
    createdAt: now(),
    updatedAt: now(),
  };
}

const placeholderDraft: OnboardingDraft = {
  displayName: '',
  birthday: '',
  primaryRole: null,
  secondaryRoles: [],
  skillLevel: 'beginner',
  yearsExperience: 0,
  media: [],
  location: null,
  teamGym: null,
  bio: '',
  availability: [],
  skillTags: [],
  currentlyWorkingOn: '',
  instagramHandle: null,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  const signUp = useCallback(async (email: string, _password: string) => {
    const uid = id('usr');
    const newUser: AuthUser = {
      id: uid,
      email,
      profile: createProfileFromDraft(uid, email, { ...placeholderDraft, primaryRole: 'coed-flyer', secondaryRoles: [] }),
    };
    setUser(newUser);
    setOnboardingComplete(false);
    return { onboardingComplete: false as const };
  }, []);

  const login = useCallback(async (_email: string, _password: string) => {
    const uid = 'usr_demo';
    const demoUser: AuthUser = {
      id: uid,
      email: _email,
      profile: {
        id: uid,
        displayName: 'Jordan K.',
        birthday: '2000-01-01',
        primaryRole: 'coed-base',
        secondaryRoles: ['side-base'],
        positions: ['coed-base', 'side-base'],
        skillLevel: 'intermediate',
        yearsExperience: 5,
        availability: ['weekends', 'events', 'weekdays'],
        skillTags: ['coed_rewind', 'coed_stunting', 'basket_toss'],
        currentlyWorkingOn: 'Full-ups and elite rewinds',
        instagramHandle: '@jordan.stunts',
        media: [
          ...seedMedia(IMG_COED_STUNT_TIKTOK, IMG_ATHLETICS_DEMO),
          { id: 'demo_photo_2', uri: IMG_COED_STUNT_TIKTOK, type: 'image' },
        ],
        location: { city: 'Austin', region: 'TX', country: 'USA', lat: 30.27, lng: -97.74 },
        teamGym: 'Austin Cheer Collective',
        bio: 'Demo profile — coed base in Austin. Three photos so the profile carousel works. Matches list is pre-seeded; open Matches to try DMs.',
        createdAt: now(),
        updatedAt: now(),
      },
    };
    setUser(demoUser);
    setOnboardingComplete(true);
    return { onboardingComplete: true as const };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setOnboardingComplete(false);
  }, []);

  const completeOnboarding = useCallback((draft: OnboardingDraft) => {
    setUser((prev) => {
      if (!prev) return null;
      const profile = createProfileFromDraft(prev.id, prev.email, draft);
      return { ...prev, profile };
    });
    setOnboardingComplete(true);
  }, []);

  const updateProfile = useCallback((partial: Partial<StunterProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev.profile, ...partial };
      if (partial.primaryRole != null || partial.secondaryRoles != null) {
        next.positions = mergePrimaryAndSecondary(next.primaryRole, next.secondaryRoles);
      }
      return { ...prev, profile: next };
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, onboardingComplete, signUp, login, logout, completeOnboarding, updateProfile }),
    [user, onboardingComplete, signUp, login, logout, completeOnboarding, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
