const FIREBASE_API_KEY = "";
const PROJECT_ID = "zyntra-1e932";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

let firebaseAuthToken = null;

export const setFirebaseToken = (token) => {
  firebaseAuthToken = token;
};

const getHeaders = () => {
  const headers = { "Content-Type": "application/json" };
  if (firebaseAuthToken) headers["Authorization"] = `Bearer ${firebaseAuthToken}`;
  return headers;
};

const fromFirestore = (data) => {
  if (!data) return null;
  if (data.fields) {
    const result = {};
    for (const key in data.fields) result[key] = fromFirestore(data.fields[key]);
    return result;
  }
  const type = Object.keys(data)[0];
  const value = data[type];
  switch (type) {
    case "stringValue": return value;
    case "doubleValue":
    case "integerValue": return Number(value);
    case "booleanValue": return value;
    case "nullValue": return null;
    case "timestampValue": return value;
    case "arrayValue": return value.values?.map((v) => fromFirestore(v)) || [];
    case "mapValue": return fromFirestore(value);
    default: return value;
  }
};

const toFirestore = (data) => {
  if (data === null || data === undefined) return { nullValue: null };
  if (typeof data === "string") return { stringValue: data };
  if (typeof data === "number") return { doubleValue: data };
  if (typeof data === "boolean") return { booleanValue: data };
  if (data instanceof Date) return { timestampValue: data.toISOString() };
  if (Array.isArray(data)) return { arrayValue: { values: data.map((v) => toFirestore(v)) } };
  if (typeof data === "object") {
    const fields = {};
    for (const key in data) fields[key] = toFirestore(data[key]);
    return { mapValue: { fields } };
  }
  return { stringValue: String(data) };
};

export const db = {
  collection: (path) => ({
    getDocs: async (pathOrQuery, params = {}) => {
      try {
        const isQuery = typeof pathOrQuery === "object" && pathOrQuery?.constraints;
        const collectionPath = isQuery ? pathOrQuery.path : typeof pathOrQuery === "string" ? pathOrQuery : pathOrQuery?.path || "users";

        if (isQuery && pathOrQuery.constraints?.length > 0) {
          const whereConstraint = pathOrQuery.constraints.find((c) => c.type === "where");
          if (whereConstraint) {
            const url = `${BASE_URL}:runQuery?key=${FIREBASE_API_KEY}`;
            const body = {
              structuredQuery: {
                from: [{ collectionId: collectionPath.split("/").pop() }],
                where: {
                  fieldFilter: {
                    field: { fieldPath: whereConstraint.field },
                    op: whereConstraint.op,
                    value: toFirestore(whereConstraint.value),
                  },
                },
              },
            };
            const response = await fetch(url, { method: "POST", headers: getHeaders(), body: JSON.stringify(body) });
            if (!response.ok) return { docs: [], nextPageToken: null };
            const data = await response.json();
            const docs = data.filter((item) => item.document).map((item) => ({
              id: item.document.name.split("/").pop(),
              data: () => fromFirestore(item.document),
            }));
            return { empty: docs.length === 0, docs, nextPageToken: null };
          }
        }

        let url = `${BASE_URL}/${collectionPath}?key=${FIREBASE_API_KEY}`;
        if (params.pageSize) url += `&pageSize=${params.pageSize}`;
        if (params.pageToken) url += `&pageToken=${params.pageToken}`;
        if (params.orderBy) url += `&orderBy=${params.orderBy}`;

        const response = await fetch(url);
        if (!response.ok) return { empty: true, docs: [], nextPageToken: null };
        const data = await response.json();
        const docs = (data.documents || []).map((doc) => ({
          id: doc.name ? doc.name.split("/").pop() : "unknown",
          data: () => fromFirestore(doc),
        }));
        return { empty: docs.length === 0, docs, nextPageToken: data.nextPageToken || null };
      } catch (e) {
        console.error("FirebaseREST error:", e);
        return { empty: true, docs: [], nextPageToken: null };
      }
    },
    addDoc: async (data) => {
      try {
        const url = `${BASE_URL}/${path}?key=${FIREBASE_API_KEY}`;
        const firestoreData = { fields: {} };
        for (const key in data) firestoreData.fields[key] = toFirestore(data[key]);
        const response = await fetch(url, { method: "POST", headers: getHeaders(), body: JSON.stringify(firestoreData) });
        if (!response.ok) throw new Error(await response.text());
        return await response.json();
      } catch (e) {
        console.error("Add error:", e);
        throw e;
      }
    },
  }),
};

export const query = (colPath, ...constraints) => ({ path: colPath, constraints });
export const where = (field, op, value) => {
  let mappedOp = "EQUAL";
  if (op === ">") mappedOp = "GREATER_THAN";
  else if (op === ">=") mappedOp = "GREATER_THAN_OR_EQUAL";
  else if (op === "<") mappedOp = "LESS_THAN";
  else if (op === "<=") mappedOp = "LESS_THAN_OR_EQUAL";
  else if (op === "in") mappedOp = "IN";
  else if (op === "array-contains") mappedOp = "ARRAY_CONTAINS";
  return { type: "where", field, op: mappedOp, value };
};

export const collection = (dbInstance, ...pathSegments) => pathSegments.join("/");
export const getDocs = async (pathOrQuery) => {
  const path = typeof pathOrQuery === "string" ? pathOrQuery : pathOrQuery?.path || "users";
  return db.collection(path).getDocs(pathOrQuery);
};

export const addDoc = async (path, data) => {
  try {
    const url = `${BASE_URL}/${path}?key=${FIREBASE_API_KEY}`;
    const firestoreData = { fields: {} };
    for (const key in data) firestoreData.fields[key] = toFirestore(data[key]);
    const response = await fetch(url, { method: "POST", headers: getHeaders(), body: JSON.stringify(firestoreData) });
    if (!response.ok) throw new Error(await response.text());
    return await response.json();
  } catch (e) {
    console.error("Add error:", e);
    throw e;
  }
};

export const serverTimestamp = () => new Date().toISOString();
export const orderBy = (field, direction = "asc") => ({ type: "orderBy", field, direction });

export const onSnapshot = (pathOrQuery, callback) => {
  getDocs(pathOrQuery).then(callback);
  const interval = setInterval(() => getDocs(pathOrQuery).then(callback), 5000);
  return () => clearInterval(interval);
};

export const updateDoc = async (docRef, data) => {
  try {
    const url = `${BASE_URL}/${docRef.path}/${docRef.id}?key=${FIREBASE_API_KEY}`;
    const firestoreData = { fields: {} };
    const fieldPaths = [];
    for (const key in data) {
      firestoreData.fields[key] = toFirestore(data[key]);
      fieldPaths.push(key);
    }
    const finalUrl = `${url}&updateMask.fieldPaths=${fieldPaths.join("&updateMask.fieldPaths=")}`;
    const response = await fetch(finalUrl, { method: "PATCH", headers: getHeaders(), body: JSON.stringify(firestoreData) });
    if (!response.ok) throw new Error(await response.text());
    return await response.json();
  } catch (e) {
    console.error("Update error:", e);
    throw e;
  }
};

export const setDoc = async (docRef, data, options) => updateDoc(docRef, data);

export const getDoc = async (docRef) => {
  try {
    const url = `${BASE_URL}/${docRef.path}/${docRef.id}?key=${FIREBASE_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return { id: docRef.id, exists: () => false, data: () => null };
    const data = await response.json();
    return { id: docRef.id, exists: () => true, data: () => fromFirestore(data) };
  } catch (e) {
    console.error("Get error:", e);
    return { id: docRef.id, exists: () => false, data: () => null };
  }
};

export const doc = (dbInstance, path, id) => ({ path, id });

export const deleteDoc = async (docRef) => {
  try {
    const url = `${BASE_URL}/${docRef.path}/${docRef.id}?key=${FIREBASE_API_KEY}`;
    const response = await fetch(url, { method: "DELETE" });
    if (!response.ok) throw new Error(await response.text());
    return true;
  } catch (e) {
    console.error("Delete error:", e);
    throw e;
  }
};
