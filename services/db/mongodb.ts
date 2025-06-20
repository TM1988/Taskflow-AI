// Client-side MongoDB service that calls API routes instead of direct database access

export const convertMongoDocument = (doc: any): any => {
  if (!doc) return doc;

  const result = { ...doc };
  
  // Convert _id to id if present
  if (result._id && typeof result._id === 'string') {
    result.id = result._id;
    delete result._id;
  }

  return result;
};

// Client-side API calls instead of direct MongoDB operations
export const getDocument = async (collectionName: string, id: string, userId?: string) => {
  const params = new URLSearchParams();
  if (userId) {
    params.append('userId', userId);
  }
  
  const response = await fetch(`/api/db/${collectionName}/${id}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch document: ${response.statusText}`);
  }
  const doc = await response.json();
  return doc ? convertMongoDocument(doc) : null;
};

export const getDocuments = async (
  collectionName: string,
  whereConditions: [string, any, any][] = [],
  orderByField?: string,
  orderDirection?: "asc" | "desc",
  userId?: string,
) => {
  const params = new URLSearchParams();
  
  // Add userId if provided
  if (userId) {
    params.append('userId', userId);
  }
  
  // Add where conditions as query parameters
  whereConditions.forEach(([field, operator, value], index) => {
    params.append(`where[${index}][field]`, field);
    params.append(`where[${index}][operator]`, operator);
    params.append(`where[${index}][value]`, String(value));
  });
  
  if (orderByField) {
    params.append('orderBy', orderByField);
    params.append('orderDirection', orderDirection || 'asc');
  }

  const response = await fetch(`/api/db/${collectionName}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch documents: ${response.statusText}`);
  }
  const docs = await response.json();
  return docs.map(convertMongoDocument);
};

export const addDocument = async (collectionName: string, data: any, userId?: string) => {
  const payload = { ...data };
  if (userId) {
    payload.userId = userId;
  }
  
  const response = await fetch(`/api/db/${collectionName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to add document: ${response.statusText}`);
  }
  
  const result = await response.json();
  return convertMongoDocument(result);
};

export const updateDocument = async (collectionName: string, id: string, data: any, userId?: string) => {
  const payload = { ...data };
  if (userId) {
    payload.userId = userId;
  }
  
  const response = await fetch(`/api/db/${collectionName}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update document: ${response.statusText}`);
  }
  
  const result = await response.json();
  return convertMongoDocument(result);
};

export const deleteDocument = async (collectionName: string, id: string, userId?: string) => {
  const params = new URLSearchParams();
  if (userId) {
    params.append('userId', userId);
  }
  
  const response = await fetch(`/api/db/${collectionName}/${id}?${params.toString()}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete document: ${response.statusText}`);
  }
  
  return true;
};

export const setDocument = async (collectionName: string, id: string, data: any) => {
  const response = await fetch(`/api/db/${collectionName}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, _isSetOperation: true }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to set document: ${response.statusText}`);
  }
  
  const result = await response.json();
  return convertMongoDocument(result);
};
