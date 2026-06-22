import { CONFIG } from '../config.js';
import { PlusIcon, SparkleIcon } from '../icons.jsx';

export default function WelcomeScreen({ onStart }) {
  return (
    <div className="welcome">
      <div className="welcome-badge">
        <PlusIcon size={34} stroke={2.2} />
      </div>

      <h1 className="welcome-title">{CONFIG.welcomeTitle}</h1>
      <p className="welcome-text">{CONFIG.welcomeText}</p>

      <button className="btn-primary" onClick={onStart}>
        <SparkleIcon /> {CONFIG.startLabel}
      </button>
    </div>
  );
}
