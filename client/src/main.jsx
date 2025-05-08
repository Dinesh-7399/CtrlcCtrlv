// src/main.jsx (or index.js) - Corrected
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx"; // Your Auth Context
import { store } from "./app/store.js";       // Your Redux Store
import { Provider } from "react-redux";    // Redux Provider

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* 1. Pass the store to the Redux Provider */}
    <Provider store={store}>
      {/* 2. AuthProvider likely doesn't need the store prop */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </Provider>
  </StrictMode>
);