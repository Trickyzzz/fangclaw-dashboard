import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import EvidenceDetail from "./pages/EvidenceDetail";
import Subscriptions from "./pages/Subscriptions";
import Pricing from "./pages/Pricing";
import Trial from "./pages/Trial";
import SharedView from "./pages/SharedView";
import DailyReport from "./pages/DailyReport";
import Landing from "./pages/Landing";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/evidence/:id"} component={EvidenceDetail} />
      <Route path={"/subscriptions"} component={Subscriptions} />
      <Route path={"/pricing"} component={Pricing} />
      <Route path={"/trial"} component={Trial} />
      <Route path={"/share/:token"} component={SharedView} />
      <Route path={"/reports"} component={DailyReport} />
      <Route path={"/landing"} component={Landing} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
