import ReactDOM from "react-dom/client";
import "@/style/index.css";
import { BrowserRouter } from "react-router-dom";
import Router from "@/routes/index";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Router />
  </BrowserRouter>
);
