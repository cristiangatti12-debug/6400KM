import styles from "../placeholder.module.css";

export default function ChatPage() {
  return (
    <div className={styles.screen}>
      <div className={styles.emoji}>💬</div>
      <h1 className={styles.title}>Chat</h1>
      <p className={styles.note}>
        Coming soon: 1-to-1 messaging with people you have connected with.
      </p>
    </div>
  );
}
