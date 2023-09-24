'use client';

import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

const amplifyConfig = {
  Auth: {
    region: process.env.NEXT_PUBLIC_AWS_REGION!,
    userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID!,
    userPoolWebClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID!,
  },
};
Amplify.configure(amplifyConfig);

function Home() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <>
          <h1>Hello {user?.username}</h1>
          <button onClick={signOut}>Sign out</button>
        </>
      )}
    </Authenticator>
  );
}

export default Home;
