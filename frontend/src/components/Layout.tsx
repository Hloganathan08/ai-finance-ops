import { type ReactNode } from "react";
import Sidebar from "./Sidebar";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-dark-900">
      <Sidebar />
      <main className="ml-64 flex-1 p-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
