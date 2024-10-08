import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';
import config from '../config';
import Login from './components/login';
import styles from './page.module.css';

export default function Home() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (!session) {
    return (
      <div className={styles.container}>
        <Image src="/logoR.svg" alt="RENET AI" width={100} height={100} />
        <h1>Asistent AI - RENET</h1>
        <Login />
      </div>
    );
  }

  if (!config.authorizedEmails.includes(session.user?.email || '')) {
    return (
      <div className={styles.container}>
        <h1>Unauthorized access</h1>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>Alege!</h1>
      <div className={styles.buttonContainer}>
        <a href="/examples/all" className={styles.redPill}>
          Toate exemplele
        </a>
        <button onClick={() => signOut()} className={styles.bluePill}>
          Sign out
        </button>
      </div>
    </div>
  );
}