'use client';

import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useEffect, useState } from 'react';

function Home() {
  const [init, setInit] = useState(false);
  const initAmplify = async () => {
    const config = await (await fetch('./aws-config.json')).json();
    const amplifyConfig = {
      Auth: {
        region: config.awsRegion,
        userPoolId: config.userPoolId,
        userPoolWebClientId: config.userPoolWebClientId,
      },
    };
    Amplify.configure(amplifyConfig);
    setInit(true);
  };

  useEffect(() => {
    initAmplify();
  }, [init, setInit]);

  return init ? (
    <Authenticator>
      {({ signOut, user }) => (
        <>
          <h1>Hello {user?.username}</h1>
          <button onClick={signOut}>Sign out</button>
        </>
      )}
    </Authenticator>
  ) : (
    <p>Loading...</p>
  );
}

export default Home;
