// src/main.jsx (or index.js) - From your previous upload
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
// AuthProvider is NOT imported or used here in THIS version you showed
import { store } from "./app/store.js";
import { Provider } from "react-redux";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <App /> {/* <== App component is rendered here */}
    </Provider>
  </StrictMode>
);