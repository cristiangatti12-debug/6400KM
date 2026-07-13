import styles from "../placeholder.module.css";

export default function TripsPage() {
  return (
    <div className={styles.screen}>
      <div className={styles.emoji}>🧳</div>
      <h1 className={styles.title}>Trips</h1>
      <p className={styles.note}>
        Coming soon: upcoming trips you can join, created by other travelers.
      </p>
    </div>
  );
}
