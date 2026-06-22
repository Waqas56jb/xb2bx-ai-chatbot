import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PlusIcon } from '../icons.jsx';

/** A single chat row. Assistant messages render markdown (tables, bold, lists). */
export default function Message({ role, content }) {
  const isUser = role === 'user';

  return (
    <div className={`msg-row ${isUser ? 'msg-row-user' : 'msg-row-bot'}`}>
      {!isUser && (
        <div className="msg-avatar">
          <PlusIcon size={16} />
        </div>
      )}

      <div className={`bubble ${isUser ? 'bubble-user' : 'bubble-bot'}`}>
        {isUser ? (
          <span className="bubble-text">{content}</span>
        ) : (
          <div className="markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
