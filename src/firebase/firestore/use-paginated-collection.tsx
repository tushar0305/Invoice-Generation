'use client';

import { useState, useEffect, useCallback, useReducer } from 'react';
import {
  Query,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  getDocs,
  query,
  limit,
  startAfter,
  DocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { WithId, InternalQuery } from './use-collection';

type PaginatedState<T> = {
  data: WithId<T>[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: FirestoreError | Error | null;
  lastVisible: DocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
};

type PaginatedAction<T> =
  | { type: 'loading' }
  | { type: 'loading-more' }
  | { type: 'loaded'; payload: { data: WithId<T>[]; lastVisible: DocumentSnapshot<DocumentData> | null; hasMore: boolean; } }
  | { type: 'append-loaded'; payload: { data: WithId<T>[]; lastVisible: DocumentSnapshot<DocumentData> | null; hasMore: boolean; } }
  | { type: 'error'; payload: FirestoreError | Error };

const createInitialState = <T>(): PaginatedState<T> => ({
  data: [],
  isLoading: true,
  isLoadingMore: false,
  error: null,
  lastVisible: null,
  hasMore: true,
});

function paginatedReducer<T>(state: PaginatedState<T>, action: PaginatedAction<T>): PaginatedState<T> {
  switch (action.type) {
    case 'loading':
      return { ...createInitialState(), isLoading: true };
    case 'loading-more':
      return { ...state, isLoading: true, isLoadingMore: true, error: null };
    case 'loaded':
      return {
        ...state,
        isLoading: false,
        isLoadingMore: false,
        data: action.payload.data,
        lastVisible: action.payload.lastVisible,
        hasMore: action.payload.hasMore,
        error: null,
      };
    case 'append-loaded':
       return {
        ...state,
        isLoading: false,
        isLoadingMore: false,
        data: [...state.data, ...action.payload.data],
        lastVisible: action.payload.lastVisible,
        hasMore: action.payload.hasMore,
        error: null,
      };
    case 'error':
      return {
        ...state,
        isLoading: false,
        isLoadingMore: false,
        error: action.payload,
        data: [],
      };
    default:
      return state;
  }
}

export interface UsePaginatedCollectionResult<T> {
  data: WithId<T>[];
  isLoading: boolean;
  error: FirestoreError | Error | null;
  loadMore: () => void;
  hasMore: boolean;
}

export function usePaginatedCollection<T = any>(
  baseQuery: (Query<DocumentData> & { __memo?: boolean }) | null | undefined,
  pageSize: number
): UsePaginatedCollectionResult<T> {

  const [state, dispatch] = useReducer(paginatedReducer<T>, createInitialState<T>());

  const fetchDocs = useCallback(async (isInitialLoad: boolean) => {
    if (!baseQuery) {
      if(isInitialLoad) dispatch({ type: 'loading' });
      return;
    }
    
    dispatch({ type: isInitialLoad ? 'loading' : 'loading-more' });

    try {
        const q = query(
            baseQuery,
            limit(pageSize),
            ...(state.lastVisible && !isInitialLoad ? [startAfter(state.lastVisible)] : [])
        );

        const snapshot: QuerySnapshot<DocumentData> = await getDocs(q);
        
        const results: WithId<T>[] = snapshot.docs.map(doc => ({
            ...(doc.data() as T),
            id: doc.id,
        }));
        
        const lastVisibleDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
        const hasMoreData = snapshot.docs.length === pageSize;

        dispatch({
            type: isInitialLoad ? 'loaded' : 'append-loaded',
            payload: { data: results, lastVisible: lastVisibleDoc, hasMore: hasMoreData }
        });

    } catch (err) {
        const path: string = (baseQuery as unknown as InternalQuery)._query.path.canonicalString();
        const contextualError = new FirestorePermissionError({
            operation: 'list',
            path,
        });

        dispatch({ type: 'error', payload: contextualError });
        errorEmitter.emit('permission-error', contextualError);
    }
  }, [baseQuery, pageSize, state.lastVisible]);


  useEffect(() => {
    // Initial fetch when the query changes
    fetchDocs(true);
  }, [baseQuery]); // Re-run initial fetch if base query changes


  const loadMore = useCallback(() => {
    if (!state.isLoading && state.hasMore) {
      fetchDocs(false);
    }
  }, [state.isLoading, state.hasMore, fetchDocs]);

  if (baseQuery && !baseQuery.__memo) {
    throw new Error('Query provided to usePaginatedCollection was not properly memoized using useMemoFirebase');
  }

  return {
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    loadMore,
    hasMore: state.hasMore,
  };
}

    