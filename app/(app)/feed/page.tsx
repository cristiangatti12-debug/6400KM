import styles from "../placeholder.module.css";

export default function FeedPage() {
  return (
    <div className={styles.screen}>
      <div className={styles.emoji}>📸</div>
      <h1 className={styles.title}>Feed</h1>
      <p className={styles.note}>
        Coming soon: Instagram-style photo posts of trips people have already
        done.
      </p>
    </div>
  );
}
