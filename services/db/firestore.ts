import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/config/firebase";

// Helper to convert Firestore data to a more usable format
export const convertTimestamps = (data: any): any => {
  if (!data) return data;

  const result = { ...data };

  Object.keys(result).forEach((key) => {
    // Convert Firestore Timestamps to JavaScript Date objects
    if (result[key] instanceof Timestamp) {
      result[key] = result[key].toDate();
    }
    // Recursively convert nested objects
    else if (typeof result[key] === "object" && result[key] !== null) {
      result[key] = convertTimestamps(result[key]);
    }
  });

  return result;
};

// Helper to add ID to document data
export const addIdToDoc = (doc: any) => {
  return {
    id: doc.id,
    ...convertTimestamps(doc.data()),
  };
};

// Generic get document function
export const getDocument = async (collectionName: string, id: string) => {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return addIdToDoc(docSnap);
  }

  return null;
};

// Generic get collection documents function
export const getDocuments = async (
  collectionName: string,
  whereConditions: [string, any, any][] = [],
  orderByField?: string,
  orderDirection?: "asc" | "desc",
) => {
  // Initialize with the collection reference
  let q = collection(db, collectionName);
  let queryRef = query(q); // Convert to Query type immediately

  // Apply where conditions if any
  if (whereConditions.length > 0) {
    whereConditions.forEach((condition) => {
      queryRef = query(
        queryRef,
        where(condition[0], condition[1], condition[2]),
      );
    });
  }

  // Apply ordering if specified
  if (orderByField) {
    queryRef = query(queryRef, orderBy(orderByField, orderDirection || "asc"));
  }

  const querySnapshot = await getDocs(queryRef);
  const documents = querySnapshot.docs.map(addIdToDoc);

  return documents;
};

// Generic add document function
export const addDocument = async (collectionName: string, data: any) => {
  // Add created/updated timestamps
  const documentData = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, collectionName), documentData);

  // Get the created document to return it with the ID
  const newDoc = await getDoc(docRef);
  return addIdToDoc(newDoc);
};

// Add document with custom ID
export const setDocument = async (
  collectionName: string,
  id: string,
  data: any,
) => {
  // Add created/updated timestamps
  const documentData = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = doc(db, collectionName, id);
  await setDoc(docRef, documentData);

  // Get the created document to return it with the ID
  const newDoc = await getDoc(docRef);
  return addIdToDoc(newDoc);
};

// Generic update document function
export const updateDocument = async (
  collectionName: string,
  id: string,
  data: any,
) => {
  const docRef = doc(db, collectionName, id);

  // Add updated timestamp
  const updateData = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(docRef, updateData);

  // Get the updated document to return it
  const updatedDoc = await getDoc(docRef);
  return addIdToDoc(updatedDoc);
};

// Generic delete document function
export const deleteDocument = async (collectionName: string, id: string) => {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
  return { id };
};
