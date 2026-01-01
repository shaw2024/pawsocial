import React, { useState } from 'react';
import './HelpChatBox.css';

function HelpChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hello! 👋 How can we help you today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);

  const quickReplies = [
    'How do I add a dog?',
    'How do I join a chatroom?',
    'How do I save dogs?',
    'How do I create a profile?',
    'Contact Support'
  ];

  const helpResponses = {
    'add a dog': 'To add a dog, click on the "Add Dog" tab and fill in your dog\'s details like name, breed, age, and upload a photo!',
    'join a chatroom': 'Visit the "Chat Rooms" tab to join different chatrooms. Click on any room name to start chatting with other dog lovers!',
    'save dogs': 'On the Community page, you can like and save your favorite dogs by clicking the heart and bookmark icons on each dog card.',
    'create a profile': 'Go to the Profile tab to set up your account, add your profile photo, and share information about yourself as a dog owner.',
    'contact support': 'You can reach our support team via email. Please provide your email and message below!',
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
          if (key === 'contact support') {
            setShowEmailForm(true);
          }
          break;
        }
      }

      setMessages(prev => [...prev, { type: 'bot', text: response }]);
    }, 500);
  };

  const handleQuickReply = (reply) => {
    if (reply === 'Contact Support') {
      handleSendMessage(reply);
    } else {
      handleSendMessage(reply);
    }
  };

  const handleSendEmail = () => {
    if (userEmail.trim() === '' || inputValue.trim() === '') {
      alert('Please fill in both email and message');
      return;
    }

    // Create mailto link
    const subject = 'PawSocial Support Request';
    const body = `Email: ${userEmail}\n\nMessage: ${inputValue}`;
    const mailtoLink = `mailto:support@pawsocial.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Open email client
    window.location.href = mailtoLink;

    // Add confirmation message
    setMessages(prev => [...prev, 
      { type: 'user', text: `Email: ${userEmail}` },
      { type: 'user', text: inputValue },
      { type: 'bot', text: 'Thank you! Your email has been opened in your email client. Please send it to contact our support team. We\'ll get back to you soon! 📧' }
    ]);

    setInputValue('');
    setUserEmail('');
    setShowEmailForm(false);
  };

  return (
    <div className="help-chatbox-container">
      {isOpen && (
        <div className="help-chatbox-backdrop" onClick={() => setIsOpen(false)} />
      )}
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

          {messages.length === 1 && !showEmailForm && (
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

          {showEmailForm && (
            <div className="help-email-form">
              <input
                type="email"
                placeholder="Your email address"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="help-email-input"
              />
              <textarea
                placeholder="Your message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="help-message-textarea"
                rows="3"
              />
              <button 
                className="help-email-send-btn" 
                onClick={handleSendEmail}
              >
                Send Email
              </button>
            </div>
          )}

          {!showEmailForm && (
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
          )}
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
