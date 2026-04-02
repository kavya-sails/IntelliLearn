import React, { useState, useEffect, useRef } from 'react';
import { Send, Upload, Loader2, MessageSquare, FileText, CheckCircle } from 'lucide-react';
import axios from 'axios';
import './App.css';

const API_BASE = 'http://localhost:8000/api';

function App() {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('COLLECTING_GOAL');
  const [skills, setSkills] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startNewChat = async () => {
    try {
      const response = await axios.post(`${API_BASE}/chat/new`);
      setSessionId(response.data.session_id);
      setSessionStatus(response.data.status);
      setMessages([
        {
          role: 'assistant',
          content: response.data.message,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error starting new chat:', error);
      alert('Failed to start new chat. Please try again.');
    }
  };

  useEffect(() => {
    startNewChat();
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/chat/message`, {
        session_id: sessionId,
        message: inputMessage,
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setSessionStatus(response.data.status);

      if (response.data.meta?.skills) {
        setSkills(response.data.meta.skills);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf')) {
      alert('Please upload a PDF file');
      return;
    }

    setUploadingFile(true);

    const fileMessage = {
      role: 'user',
      content: `[Uploading resume: ${file.name}]`,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, fileMessage]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_BASE}/chat/upload-resume?session_id=${sessionId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const assistantMessage = {
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setSessionStatus(response.data.status);

      if (response.data.skills) {
        setSkills(response.data.skills);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Failed to upload resume. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getStatusBadge = () => {
    const statusMap = {
      COLLECTING_GOAL: { text: 'Setting Goal', color: '#3b82f6' },
      COLLECTING_RESUME: { text: 'Awaiting Resume', color: '#f59e0b' },
      PARSING_SKILLS: { text: 'Analyzing Skills', color: '#8b5cf6' },
      AWAITING_QUIZ: { text: 'Ready for Assessment', color: '#10b981' },
    };

    const status = statusMap[sessionStatus] || { text: sessionStatus, color: '#6b7280' };

    return (
      <div
        className="status-badge"
        style={{ backgroundColor: status.color }}
      >
        {status.text}
      </div>
    );
  };

  return (
    <div className="app">
      <div className="chat-container">
        <div className="chat-header">
          <div className="header-left">
            <MessageSquare size={24} />
            <h1>IntelliLearn</h1>
          </div>
          <div className="header-right">
            {getStatusBadge()}
            <button className="new-chat-btn" onClick={startNewChat}>
              New Chat
            </button>
          </div>
        </div>

        <div className="messages-container">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="message-content">
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message assistant">
              <div className="message-content">
                <Loader2 className="spinner" size={20} />
                <span>Thinking...</span>
              </div>
            </div>
          )}

          {skills.length > 0 && (
            <div className="skills-panel">
              <h3>
                <CheckCircle size={20} />
                Extracted Skills ({skills.length})
              </h3>
              <div className="skills-grid">
                {skills.map((skill, idx) => (
                  <div key={idx} className="skill-card">
                    <span className="skill-name">{skill.skill_name}</span>
                    <span className={`skill-level ${skill.level}`}>
                      {skill.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          {(sessionStatus === 'COLLECTING_RESUME' || sessionStatus === 'COLLECTING_GOAL') && (
            <button
              className="upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile}
            >
              {uploadingFile ? (
                <Loader2 className="spinner" size={20} />
              ) : (
                <Upload size={20} />
              )}
              <span>{uploadingFile ? 'Uploading...' : 'Upload Resume'}</span>
            </button>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf"
            style={{ display: 'none' }}
          />

          <form onSubmit={sendMessage} className="message-form">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="message-input"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="send-btn"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
