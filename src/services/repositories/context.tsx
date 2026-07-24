import { createContext, useContext, type ReactNode } from "react";
import { repositories as defaultRepositories } from ".";
import type { Repositories } from "./types";

const RepositoryContext = createContext<Repositories>(defaultRepositories);

export function RepositoryProvider({
  children,
  value = defaultRepositories,
}: {
  children: ReactNode;
  value?: Repositories;
}) {
  return <RepositoryContext.Provider value={value}>{children}</RepositoryContext.Provider>;
}

export function useRepositories(): Repositories {
  return useContext(RepositoryContext);
}
