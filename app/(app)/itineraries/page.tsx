import styles from "../placeholder.module.css";

export default function ItinerariesPage() {
  return (
    <div className={styles.screen}>
      <div className={styles.emoji}>🗺️</div>
      <h1 className={styles.title}>Itineraries</h1>
      <p className={styles.note}>
        Coming soon: map-first route cards with photos from users who did the
        trip, plus AI suggestions.
      </p>
    </div>
  );
}
