import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Messages() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [activeMatch, setActiveMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get('/matches?limit=100')
      .then(r => {
        const chatMatches = (r.data.matches || []).filter(m =>
          ['contact_accepted', 'verifying', 'handover_scheduled', 'returned'].includes(m.match_status)
        );
        setMatches(chatMatches);
        if (chatMatches.length) setActiveMatch(chatMatches[0]);
      }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeMatch) return;
    setLoading(true);
    api.get(`/messages/${activeMatch.id}`)
      .then(r => setMessages(r.data.messages || []))
      .catch(() => toast.error('Failed to load messages'))
      .finally(() => setLoading(false));
  }, [activeMatch]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMsg = async e => {
    e.preventDefault();
    if (!newMsg.trim() || !activeMatch) return;
    setSending(true);
    try {
      const res = await api.post('/messages', { match_id: activeMatch.id, message: newMsg.trim() });
      setMessages(prev => [...prev, res.data.message]);
      setNewMsg('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally { setSending(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">💬 Secure Messages</h1>
        <p className="page-subtitle">Private conversations — contact details are never exposed</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', height: '72vh' }}>
        {/* Sidebar: conversation list */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="card-header">
            <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>🗂️ Conversations</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {matches.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
                No active conversations yet.<br />
                Accept a contact request from a match to start chatting.
              </div>
            ) : matches.map(m => (
              <div key={m.id} onClick={() => setActiveMatch(m)}
                style={{
                  padding: '0.875rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f3f4f6',
                  background: activeMatch?.id === m.id ? '#eff6ff' : 'white',
                  borderLeft: activeMatch?.id === m.id ? '3px solid #2563eb' : '3px solid transparent',
                  transition: 'all 0.15s'
                }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{m.lost_item_name}</div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  Match: {m.match_score}% • {m.match_status === 'handover_scheduled' ? '📅 Handover set' : '✅ Active'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat window */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!activeMatch ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: '#9ca3af' }}>
              <div style={{ fontSize: '4rem' }}>💬</div>
              <div style={{ fontWeight: 600 }}>Select a conversation</div>
              <div style={{ fontSize: '0.875rem' }}>Choose a match from the left panel</div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="card-header" style={{ borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ fontWeight: 700 }}>{activeMatch.lost_item_name}</div>
                <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.1rem' }}>
                  🔒 Secure Chat • Match Score: {activeMatch.match_score}%
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#f9fafb' }}>
                <div style={{ textAlign: 'center', background: '#e5e7eb', borderRadius: 99, padding: '0.4rem 1rem', fontSize: '0.72rem', color: '#6b7280', alignSelf: 'center' }}>
                  🔒 This is a secure private conversation. Do not share personal contact details unless you are ready.
                </div>

                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                    <div className="spinner" />
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
                    No messages yet. Start the conversation by asking about the item details.
                  </div>
                ) : messages.map(msg => (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.is_mine ? 'flex-end' : 'flex-start' }}>
                    {!msg.is_mine && (
                      <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.2rem', paddingLeft: '0.25rem' }}>
                        {msg.sender_name}
                      </div>
                    )}
                    <div className={`message-bubble ${msg.is_mine ? 'mine' : 'theirs'}`}>
                      {msg.message}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#d1d5db', marginTop: '0.2rem' }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form onSubmit={sendMsg} style={{ padding: '1rem', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '0.75rem', background: 'white' }}>
                <input
                  className="form-control"
                  style={{ flex: 1 }}
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  placeholder="Type a message... (e.g., describe a unique feature to verify)"
                  disabled={sending}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(e); } }}
                />
                <button type="submit" className="btn btn-primary" disabled={sending || !newMsg.trim()}>
                  {sending ? '⏳' : '➤ Send'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
