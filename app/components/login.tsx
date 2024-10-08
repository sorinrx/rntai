'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import styles from './login.module.css';

export default function Login() {
  const { data: session } = useSession();

  return (
    <div>
      {session ? (
        <>
          <p>Signed in as {session.user?.email}</p>
          <button className={styles.button} onClick={() => signOut()}>Sign out</button>
        </>
      ) : (
        <>
          <button className={styles.button} onClick={() => signIn('google')}>Sign in with Google</button>
        </>
      )}
    </div>
  );
}
  