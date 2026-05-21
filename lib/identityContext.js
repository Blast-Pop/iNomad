import { createContext, useContext } from 'react';

export const IdentityContext = createContext({
  identity: null,
  setIdentity: () => {},
});

export function useIdentity() {
  return useContext(IdentityContext);
}
