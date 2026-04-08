'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, Platform } from 'react-native';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import type { AuthUser, OnboardingDraft, StunterProfile } from '@/types';
import { mergePrimaryAndSecondary } from '@/constants/positions';
import { now } from '@/data/mockData';
import { callDeleteMyAccount } from '@/lib/callDeleteMyAccount';
import { getFirestoreDb } from '@/lib/firebaseApp';
import { getFirebaseAuth } from '@/lib/getFirebaseAuth';
import { profileFromFirestore, serializeProfile } from '@/lib/firestoreProfile';
import { mapAuthError } from '@/lib/mapAuthError';
import { mapDeleteAccountError } from '@/lib/mapDeleteAccountError';
import { syncPublicProfileDoc } from '@/lib/syncPublicProfile';
import { useWebFCMRegistration } from '@/hooks/useWebFCMRegistration';

interface AuthContextValue {
  authReady: boolean;
  user: AuthUser | null;
  onboardingComplete: boolean;
  signUp: (email: string, password: string) => Promise<{ onboardingComplete: boolean }>;
  login: (email: string, password: string) => Promise<{ onboardingComplete: boolean }>;
  logout: () => void;
  completeOnboarding: (draft: OnboardingDraft) => Promise<void>;
  updateProfile: (partial: Partial<StunterProfile>) => Promise<void>;
  /** Native Google: ID token → session, then sync profile from the server. */
  signInWithGoogleFromIdToken: (idToken: string) => Promise<{ onboardingComplete: boolean }>;
  /** Web: after Google popup completes, sync profile from the server (redirect flows use getRedirectResult in the provider). */
  finalizeGoogleUser: (user: User) => Promise<{ onboardingComplete: boolean }>;
  /**
   * Close this account for good: server removes profile media, cleans squads/listings, redacts Firestore,
   * then deletes the Firebase Auth user. Callers should navigate to welcome after `ok`.
   */
  closeAccount: () => Promise<{ ok: true } | { ok: false; message: string }>;
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

function createPlaceholderProfile(
  uid: string,
  email: string,
  displayName?: string | null,
): StunterProfile {
  return {
    id: uid,
    email,
    displayName: (displayName?.trim() || 'Stunter').slice(0, 80),
    birthday: '',
    primaryRole: 'coed-flyer',
    secondaryRoles: [],
    positions: ['coed-flyer'],
    skillLevel: 'beginner',
    yearsExperience: 0,
    availability: [],
    skillTags: [],
    currentlyWorkingOn: '',
    instagramHandle: null,
    media: [],
    location: null,
    teamGym: null,
    bio: '',
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
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const userRef = useRef<AuthUser | null>(null);
  userRef.current = user;
  const onboardingCompleteRef = useRef(onboardingComplete);
  onboardingCompleteRef.current = onboardingComplete;

  useWebFCMRegistration(user?.id ?? null, onboardingComplete && user != null);

  const syncFromFirestore = useCallback(async (fbUser: User): Promise<{ onboardingComplete: boolean }> => {
    const db = getFirestoreDb();
    const ref = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(ref);
    const email = fbUser.email ?? '';

    if (!snap.exists()) {
      const profile = createPlaceholderProfile(fbUser.uid, email, fbUser.displayName);
      await setDoc(ref, {
        onboardingComplete: false,
        profile: serializeProfile(profile),
      });
      setUser({ id: fbUser.uid, email, profile });
      setOnboardingComplete(false);
      void syncPublicProfileDoc(fbUser.uid, profile, false);
      return { onboardingComplete: false };
    }

    const data = snap.data();
    if (data.accountClosedAt != null) {
      try {
        await signOut(getFirebaseAuth());
      } catch {
        /* ignore */
      }
      setUser(null);
      setOnboardingComplete(false);
      return { onboardingComplete: false };
    }
    const complete = data.onboardingComplete === true;
    const parsed = profileFromFirestore(data.profile, fbUser.uid, email);
    if (!parsed) {
      const profile = createPlaceholderProfile(fbUser.uid, email, fbUser.displayName);
      await setDoc(
        ref,
        { onboardingComplete: false, profile: serializeProfile(profile) },
        { merge: true },
      );
      setUser({ id: fbUser.uid, email, profile });
      setOnboardingComplete(false);
      void syncPublicProfileDoc(fbUser.uid, profile, false);
      return { onboardingComplete: false };
    }
    const profile = { ...parsed, email: parsed.email || email };
    setUser({ id: fbUser.uid, email: profile.email || email, profile });
    setOnboardingComplete(complete);
    void syncPublicProfileDoc(fbUser.uid, profile, complete);
    return { onboardingComplete: complete };
  }, []);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      const auth = getFirebaseAuth();
      unsub = onAuthStateChanged(auth, async (fbUser) => {
        try {
          if (!fbUser) {
            setUser(null);
            setOnboardingComplete(false);
            return;
          }
          await syncFromFirestore(fbUser);
        } finally {
          setAuthReady(true);
        }
      });
    } catch {
      setAuthReady(true);
    }
    return () => unsub?.();
  }, [syncFromFirestore]);

  /** Complete Google redirect sign-in when the app reloads after OAuth (mobile web). */
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let cancelled = false;
    void (async () => {
      try {
        const auth = getFirebaseAuth();
        const result = await getRedirectResult(auth);
        if (cancelled || !result?.user) return;
        await syncFromFirestore(result.user);
      } catch (e: unknown) {
        if (cancelled) return;
        const code =
          e && typeof e === 'object' && 'code' in e ? String((e as { code: string }).code) : '';
        if (code) {
          Alert.alert('Sign in', mapAuthError(code));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [syncFromFirestore]);

  const signUp = useCallback(
    async (email: string, password: string) => {
      const auth = getFirebaseAuth();
      const db = getFirestoreDb();
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const profile = createProfileFromDraft(cred.user.uid, email.trim(), {
        ...placeholderDraft,
        primaryRole: 'coed-flyer',
        secondaryRoles: [],
      });
      await setDoc(doc(db, 'users', cred.user.uid), {
        onboardingComplete: false,
        profile: serializeProfile(profile),
      });
      return syncFromFirestore(cred.user);
    },
    [syncFromFirestore],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const auth = getFirebaseAuth();
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      return syncFromFirestore(cred.user);
    },
    [syncFromFirestore],
  );

  const logout = useCallback(() => {
    try {
      void signOut(getFirebaseAuth()).catch(() => undefined);
    } catch {
      /* ignore */
    }
  }, []);

  const closeAccount = useCallback(async () => {
    try {
      await callDeleteMyAccount();
    } catch (e: unknown) {
      return { ok: false as const, message: mapDeleteAccountError(e) };
    }
    try {
      await signOut(getFirebaseAuth());
    } catch {
      /* auth user may already be gone server-side */
    }
    setUser(null);
    setOnboardingComplete(false);
    return { ok: true as const };
  }, []);

  const completeOnboarding = useCallback(
    async (draft: OnboardingDraft) => {
      const auth = getFirebaseAuth();
      const fbUser = auth.currentUser;
      if (!fbUser) return;
      const email = fbUser.email ?? '';
      const profile = createProfileFromDraft(fbUser.uid, email, draft);
      const db = getFirestoreDb();
      await setDoc(
        doc(db, 'users', fbUser.uid),
        {
          onboardingComplete: true,
          profile: serializeProfile(profile),
        },
        { merge: true },
      );
      setUser({ id: fbUser.uid, email, profile });
      setOnboardingComplete(true);
      void syncPublicProfileDoc(fbUser.uid, profile, true);
    },
    [],
  );

  const updateProfile = useCallback(async (partial: Partial<StunterProfile>) => {
    const fbUser = getFirebaseAuth().currentUser;
    const prev = userRef.current;
    if (!fbUser || !prev) return;
    const next = { ...prev.profile, ...partial };
    if (partial.primaryRole != null || partial.secondaryRoles != null) {
      next.positions = mergePrimaryAndSecondary(next.primaryRole, next.secondaryRoles);
    }
    next.updatedAt = now();
    try {
      await updateDoc(doc(getFirestoreDb(), 'users', fbUser.uid), {
        profile: serializeProfile(next),
      });
      setUser({ ...prev, profile: next });
      void syncPublicProfileDoc(fbUser.uid, next, onboardingCompleteRef.current);
    } catch {
      Alert.alert('Profile', 'Could not save changes. Try again.');
    }
  }, []);

  const signInWithGoogleFromIdToken = useCallback(
    async (idToken: string) => {
      const auth = getFirebaseAuth();
      const cred = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, cred);
      return syncFromFirestore(result.user);
    },
    [syncFromFirestore],
  );

  const finalizeGoogleUser = useCallback(
    async (fbUser: User) => syncFromFirestore(fbUser),
    [syncFromFirestore],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      authReady,
      user,
      onboardingComplete,
      signUp,
      login,
      logout,
      completeOnboarding,
      updateProfile,
      signInWithGoogleFromIdToken,
      finalizeGoogleUser,
      closeAccount,
    }),
    [
      authReady,
      user,
      onboardingComplete,
      signUp,
      login,
      logout,
      closeAccount,
      completeOnboarding,
      updateProfile,
      signInWithGoogleFromIdToken,
      finalizeGoogleUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
