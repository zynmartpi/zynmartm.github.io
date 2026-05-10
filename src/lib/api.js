let authToken = null;

const defaultHeaders = {
  "Content-Type": "application/json",
};

const request = async (url, init = {}) => {
  const headers = {
    ...defaultHeaders,
    ...(authToken ? { Authorization: authToken } : {}),
    ...(init.headers || {}),
  };

  const response = await fetch(url, { ...init, headers });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data =
    response.status === 204
      ? null
      : isJson
      ? await response.json()
      : await response.text();

  if (!response.ok) {
    const error = new Error(response.statusText || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return { data, status: response.status, statusText: response.statusText, headers: response.headers };
};

export const api = {
  get: (url, init) => request(url, { ...init, method: "GET" }),
  delete: (url, init) => request(url, { ...init, method: "DELETE" }),
  post: (url, body, init) =>
    request(url, {
      ...init,
      method: "POST",
      body: body === undefined ? init?.body : JSON.stringify(body),
    }),
  put: (url, body, init) =>
    request(url, {
      ...init,
      method: "PUT",
      body: body === undefined ? init?.body : JSON.stringify(body),
    }),
  patch: (url, body, init) =>
    request(url, {
      ...init,
      method: "PATCH",
      body: body === undefined ? init?.body : JSON.stringify(body),
    }),
};

export const setApiAuthToken = (token) => {
  authToken = token;
};
