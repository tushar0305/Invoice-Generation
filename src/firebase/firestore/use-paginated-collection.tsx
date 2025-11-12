'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  query,
  limit,
  startAfter,
  DocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type WithId<T> = T & { id: string };

export interface UsePaginatedCollectionResult<T> {
  data: WithId<T>[];
  isLoading: boolean;
  error: FirestoreError | Error | null;
  loadMore: () => void;
  hasMore: boolean;
}

export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

export function usePaginatedCollection<T = any>(
  baseQuery: Query<DocumentData> | null,
  pageSize: number
): UsePaginatedCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[]>([]);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot<DocumentData> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const memoizedBaseQuery = useMemo(() => baseQuery, [baseQuery]);

  const handleSnapshot = (snapshot: QuerySnapshot<DocumentData>, isInitialLoad: boolean) => {
    if (snapshot.empty) {
      if (isInitialLoad) setData([]);
      setHasMore(false);
      return;
    }

    const newDocs = snapshot.docs.map(doc => ({
      ...(doc.data() as T),
      id: doc.id,
    }));

    setData(prevData => isInitialLoad ? newDocs : [...prevData, ...newDocs]);
    setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
    setHasMore(snapshot.docs.length === pageSize);
    setError(null);
  };
  
  const handleError = (err: FirestoreError) => {
     const path = baseQuery ? (baseQuery as unknown as InternalQuery)._query.path.canonicalString() : 'unknown';
      const contextualError = new FirestorePermissionError({
        operation: 'list',
        path,
      });

      setError(contextualError);
      setData([]);
      errorEmitter.emit('permission-error', contextualError);
  }

  // Effect for initial load and query changes
  useEffect(() => {
    if (!memoizedBaseQuery) {
      setData([]);
      setIsLoading(true);
      setHasMore(true);
      setLastDoc(null);
      return;
    }

    setIsLoading(true);
    setLastDoc(null); // Reset pagination on query change

    const initialQuery = query(memoizedBaseQuery, limit(pageSize));
    const unsubscribe = onSnapshot(initialQuery, 
      (snapshot) => {
        handleSnapshot(snapshot, true);
        setIsLoading(false);
      }, 
      (err) => {
        handleError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedBaseQuery, pageSize]);

  const loadMore = useCallback(() => {
    if (!memoizedBaseQuery || !hasMore || isLoadingMore || !lastDoc) return;

    setIsLoadingMore(true);

    const nextQuery = query(memoizedBaseQuery, startAfter(lastDoc), limit(pageSize));
    const unsubscribe = onSnapshot(nextQuery, 
      (snapshot) => {
        handleSnapshot(snapshot, false);
        setIsLoadingMore(false);
      }, 
      (err) => {
        handleError(err);
        setIsLoadingMore(false);
      }
    );
    
    return unsubscribe;
  }, [memoizedBaseQuery, lastDoc, hasMore, isLoadingMore, pageSize]);
  
  return { data, isLoading: isLoading || isLoadingMore, error, loadMore, hasMore };
}
