const MAX_HISTORY = 10;

const state = {
  searchHistory: [],
  listeners: [],
};

const notify = () => state.listeners.forEach((fn) => fn());
export const onSearchHistoryChange = (fn) => {
  state.listeners.push(fn);
  return () => { state.listeners = state.listeners.filter((l) => l !== fn); };
};

const loadHistory = () => {
  try {
    const saved = localStorage.getItem("zynmart_search_history");
    if (saved) state.searchHistory = JSON.parse(saved);
  } catch {}
};

const saveHistory = () => {
  localStorage.setItem("zynmart_search_history", JSON.stringify(state.searchHistory));
};

export const getSearchHistory = () => state.searchHistory;

export const addSearch = (query) => {
  const trimmed = query.trim();
  if (!trimmed) return;
  const filtered = state.searchHistory.filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
  state.searchHistory = [trimmed, ...filtered].slice(0, MAX_HISTORY);
  saveHistory();
  notify();
};

export const removeSearch = (query) => {
  state.searchHistory = state.searchHistory.filter((q) => q !== query);
  saveHistory();
  notify();
};

export const clearHistory = () => {
  state.searchHistory = [];
  saveHistory();
  notify();
};

loadHistory();
