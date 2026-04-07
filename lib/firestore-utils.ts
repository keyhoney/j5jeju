import { 
  collection, 
  doc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc,
  getDocFromServer,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import type { Day, NewPlace, NewTrip, Place, Trip } from './types';

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
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Test connection
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// Trip Utils
export const tripsCol = collection(db, 'trips');

export function subscribeTrips(userId: string, callback: (trips: Trip[]) => void) {
  const q = query(tripsCol, where('ownerId', '==', userId), orderBy('startDate', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const trips = snapshot.docs.map((tripDoc) => ({ id: tripDoc.id, ...tripDoc.data() } as Trip));
    callback(trips);
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'trips'));
}

export async function createTrip(trip: NewTrip) {
  try {
    return await addDoc(tripsCol, trip);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'trips');
  }
}

// Day Utils
export function getDaysCol(tripId: string) {
  return collection(db, 'trips', tripId, 'days');
}

export function subscribeDays(tripId: string, callback: (days: Day[]) => void) {
  const q = query(getDaysCol(tripId), orderBy('dayNumber', 'asc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((dayDoc) => ({ id: dayDoc.id, ...dayDoc.data() } as Day)));
  }, (error) => handleFirestoreError(error, OperationType.LIST, `trips/${tripId}/days`));
}

// Place Utils
export function getPlacesCol(tripId: string, dayId: string) {
  return collection(db, 'trips', tripId, 'days', dayId, 'places');
}

export function subscribePlaces(tripId: string, dayId: string, callback: (places: Place[]) => void) {
  const q = query(getPlacesCol(tripId, dayId), orderBy('order', 'asc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((placeDoc) => ({ id: placeDoc.id, ...placeDoc.data() } as Place)));
  }, (error) => handleFirestoreError(error, OperationType.LIST, `trips/${tripId}/days/${dayId}/places`));
}

export async function addPlace(tripId: string, dayId: string, place: NewPlace) {
  try {
    return await addDoc(getPlacesCol(tripId, dayId), place);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `trips/${tripId}/days/${dayId}/places`);
  }
}

export async function updatePlace(
  tripId: string,
  dayId: string,
  placeId: string,
  data: Partial<Omit<Place, 'id'>>
) {
  try {
    const placeRef = doc(db, 'trips', tripId, 'days', dayId, 'places', placeId);
    await updateDoc(placeRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `trips/${tripId}/days/${dayId}/places/${placeId}`);
  }
}

export async function deletePlace(tripId: string, dayId: string, placeId: string) {
  try {
    const placeRef = doc(db, 'trips', tripId, 'days', dayId, 'places', placeId);
    await deleteDoc(placeRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `trips/${tripId}/days/${dayId}/places/${placeId}`);
  }
}

export async function reorderPlaces(tripId: string, dayId: string, orderedPlaceIds: string[]) {
  try {
    const batch = writeBatch(db);
    orderedPlaceIds.forEach((placeId, index) => {
      const placeRef = doc(db, 'trips', tripId, 'days', dayId, 'places', placeId);
      batch.update(placeRef, { order: index });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `trips/${tripId}/days/${dayId}/places`);
  }
}

export async function bulkUpdatePlaces(
  tripId: string,
  dayId: string,
  placeIds: string[],
  data: Partial<Omit<Place, "id">>
) {
  try {
    const batch = writeBatch(db);
    placeIds.forEach((placeId) => {
      const placeRef = doc(db, 'trips', tripId, 'days', dayId, 'places', placeId);
      batch.update(placeRef, data);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `trips/${tripId}/days/${dayId}/places`);
  }
}

export async function bulkDeletePlaces(tripId: string, dayId: string, placeIds: string[]) {
  try {
    const batch = writeBatch(db);
    placeIds.forEach((placeId) => {
      const placeRef = doc(db, 'trips', tripId, 'days', dayId, 'places', placeId);
      batch.delete(placeRef);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `trips/${tripId}/days/${dayId}/places`);
  }
}
