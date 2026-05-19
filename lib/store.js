// lib/store.js
import { create } from 'zustand';
import { fetchRealGitHubData, calculateScores } from './engine';

export const useStore = create((set) => ({
  repos: [],
  loading: false,
  error: null,
  
  addRepo: async (repoName) => {
    set({ loading: true, error: null });
    try {
      // Invoke live REST API query methods over HTTP
      const rawData = await fetchRealGitHubData(repoName);
      const analysis = calculateScores(rawData);
      
      const newRepo = {
        id: Date.now(),
        name: rawData.name,
        rawData,
        analysis
      };

      set((state) => {
        // Prevent stacking duplicates inside the comparison metrics array
        if (state.repos.some(r => r.name.toLowerCase() === rawData.name.toLowerCase())) {
          return { loading: false, error: "This repository has already been analyzed!" };
        }
        return { repos: [newRepo, ...state.repos], loading: false };
      });
    } catch (err) {
      set({ error: err.message || "An unexpected network diagnosis error occurred.", loading: false });
    }
  },
  
  removeRepo: (id) => set((state) => ({
    repos: state.repos.filter((r) => r.id !== id)
  })),
  
  clearAll: () => set({ repos: [] })
}));
