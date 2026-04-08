import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  addDoc,
  getDocFromServer,
  where,
  type FieldValue,
} from 'firebase/firestore';
import { db } from './firebase';
import { getScheduleCollectionName } from './constants';
import { sortSchedulePlaces } from './schedule-sort';
import type { NewSchedulePlace, SchedulePlace } from './types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

export function getScheduleCol() {
  return collection(db, getScheduleCollectionName());
}

export function subscribeSchedulePlaces(dayIndex: number, callback: (places: SchedulePlace[]) => void) {
  const q = query(getScheduleCol(), where('dayIndex', '==', dayIndex));
  return onSnapshot(
    q,
    (snapshot) => {
      const rows = snapshot.docs.map((d) => {
        const data = d.data();
        return { id: d.id, ...data, time: typeof data.time === 'string' ? data.time : '' } as SchedulePlace;
      });
      callback(sortSchedulePlaces(rows));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, getScheduleCollectionName())
  );
}

export async function addSchedulePlace(place: NewSchedulePlace) {
  try {
    return await addDoc(getScheduleCol(), place);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, getScheduleCollectionName());
  }
}

export async function updateSchedulePlace(
  placeId: string,
  data: Partial<Omit<SchedulePlace, 'id' | 'memo'>> & { memo?: string | FieldValue }
) {
  try {
    const ref = doc(db, getScheduleCollectionName(), placeId);
    await updateDoc(ref, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${getScheduleCollectionName()}/${placeId}`);
  }
}

export async function deleteSchedulePlace(placeId: string) {
  try {
    await deleteDoc(doc(db, getScheduleCollectionName(), placeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${getScheduleCollectionName()}/${placeId}`);
  }
}

