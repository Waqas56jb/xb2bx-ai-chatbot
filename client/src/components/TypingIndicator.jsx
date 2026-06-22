import { PlusIcon } from '../icons.jsx';

export default function TypingIndicator() {
  return (
    <div className="msg-row msg-row-bot">
      <div className="msg-avatar">
        <PlusIcon size={16} />
      </div>
      <div className="bubble bubble-bot typing">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
    </div>
  );
}
