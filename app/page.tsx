"use client";

import React from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Login from "./components/login";
import styles from "./page.module.css";
import config from '../config'; // importă fișierul de configurare


const Home = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return (
      <main className={styles.main}>
        <img src="/logoRenet.svg" className={styles.logo} alt="Renet Logo" />
        <div className={styles.title}>RENET AI</div>
        <Login />
      </main>
    );
  }

  if (!config.authorizedEmails.includes(session.user.email)) {
    return (
      <main className={styles.main}>
        <div className={styles.title}>Unauthorized access</div>
        <button className={styles.bluePill} onClick={() => signOut()}>Blue Pill</button>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.title}>
        Alege!
      </div>
      <div className={styles.container}>
        <a className={styles.redPill} href="/examples/all">
          Red Pill
        </a>
        <div className={styles.spacer}></div>
        <button className={styles.bluePill} onClick={() => signOut()}>Blue Pill</button>
      </div>
    </main>
  );
};

export default Home;
