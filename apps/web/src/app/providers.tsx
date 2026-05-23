'use client';

import { ApolloProvider } from '@apollo/client';
import { Provider as ReduxProvider } from 'react-redux';
import { apolloClient } from '@/lib/apollo';
import { store } from '@/store';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <ApolloProvider client={apolloClient}>
        {children}
      </ApolloProvider>
    </ReduxProvider>
  );
}
