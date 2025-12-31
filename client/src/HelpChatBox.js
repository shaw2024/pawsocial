import React, { useState } from 'react';
import './HelpChatBox.css';

function HelpChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hello! 👋 How can we help you today?' }
  ]);
  const [inputValue, setInputValue] = useState('');

  const quickReplies = [
    'How do I add a dog?',
    'How do I join a chatroom?',
    'How do I save dogs?',
    'How do I create a profile?'
  ];

  const helpResponses = {
    'add a dog': 'To add a dog, click on the "Add Dog" tab and fill in your dog\'s details like name, breed, age, and upload a photo!',
    'join a chatroom': 'Visit the "Chat Rooms" tab to join different chatrooms. Click on any room name to start chatting with other dog lovers!',
    'save dogs': 'On the Community page, you can like and save your favorite dogs by clicking the heart and bookmark icons on each dog card.',
    'create a profile': 'Go to the Profile tab to set up your account, add your profile photo, and share information about yourself as a dog owner.',
    'default': 'Thanks for reaching out! For more help, please visit our Getting Started guide or check out the Community chatrooms. 🐕'
  };

  const handleSendMessage = (text) => {
    if (text.trim() === '') return;

    // Add user message
    setMessages([...messages, { type: 'user', text }]);
    setInputValue('');

    // Simulate bot response
    setTimeout(() => {
      const lowerText = text.toLowerCase();
      let response = helpResponses['default'];

      for (const key in helpResponses) {
        if (lowerText.includes(key)) {
          response = helpResponses[key];
          break;
        }
      }

      setMessages(prev => [...prev, { type: 'bot', text: response }]);
    }, 500);
  };

  const handleQuickReply = (reply) => {
    handleSendMessage(reply);
  };

  return (
    <div className="help-chatbox-container">
      {isOpen ? (
        <div className="help-chatbox-window">
          <div className="help-chatbox-header">
            <h3>Get Help 💬</h3>
            <button className="help-close-btn" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="help-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`help-message help-message-${msg.type}`}>
                <p>{msg.text}</p>
              </div>
            ))}
          </div>

          {messages.length === 1 && (
            <div className="help-quick-replies">
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  className="help-quick-reply-btn"
                  onClick={() => handleQuickReply(reply)}
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          <div className="help-input-box">
            <input
              type="text"
              placeholder="Ask something..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
            />
            <button 
              className="help-send-btn" 
              onClick={() => handleSendMessage(inputValue)}
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <button 
          className="help-chatbox-button"
          onClick={() => setIsOpen(true)}
        >
          💬 Get Help
        </button>
      )}
    </div>
  );
}

export default HelpChatBox;
