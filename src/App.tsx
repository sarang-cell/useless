import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, User, Clock, Check, CheckCheck, Send, Mic } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Message {
  id: number;
  sender: 'avi' | 'rhea' | 'user';
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  delay?: number;
}

interface Phase {
  name: string;
  color: string;
  description: string;
  context: string;
  messages: Omit<Message, 'id' | 'timestamp' | 'status'>[];
}

const phases: Phase[] = [
  {
    name: "Situationship",
    color: "from-purple-400 to-pink-400",
    description: "The uncertainty and excitement of something new",
    context: "You are in a situationship phase. Avi (20, soft and calm, hides emotions) and Rhea (19, expressive and loving) are talking frequently and flirting, but haven't defined their relationship. There's uncertainty and excitement. Respond as either Avi or Rhea based on the conversation flow. Keep responses realistic, not overly dramatic. Use emojis appropriately.",
    messages: [
      { sender: 'rhea', text: 'hey you! what are you up to tonight?', delay: 1000 },
      { sender: 'avi', text: 'just chilling at home, thinking about someone 👀', delay: 2000 },
      { sender: 'rhea', text: 'oh really? anyone I know? 😏', delay: 1500 },
      { sender: 'avi', text: 'maybe... she has these beautiful eyes and an amazing laugh', delay: 3000 },
      { sender: 'rhea', text: 'stop itttt 🙈 you\'re making me blush', delay: 2000 }
    ]
  },
  {
    name: "Honeymoon",
    color: "from-pink-400 to-red-400",
    description: "Everything feels magical and perfect",
    context: "You are in the honeymoon phase. Avi and Rhea are now officially dating. Everything feels magical and perfect. They exchange sweet and intense love messages. Respond as either Avi or Rhea with romantic, loving messages. Keep it authentic, not cringey.",
    messages: [
      { sender: 'rhea', text: 'good morning my favorite person ❤️', delay: 1000 },
      { sender: 'avi', text: 'waking up to your texts is the best feeling ever', delay: 2000 },
      { sender: 'rhea', text: 'I can\'t stop thinking about last night... dancing under the stars', delay: 2500 },
      { sender: 'avi', text: 'you looked so beautiful. I think I\'m falling for you', delay: 3000 },
      { sender: 'rhea', text: 'I think I already fell 💕', delay: 1500 }
    ]
  },
  {
    name: "Relationship",
    color: "from-blue-400 to-indigo-400",
    description: "Building something real together",
    context: "You are in a committed relationship phase. Avi and Rhea are building something real together. Show deeper bonding, daily life conversations, emotional support, and some small misunderstandings that get resolved. Respond as either Avi or Rhea with mature, supportive messages.",
    messages: [
      { sender: 'avi', text: 'how was your exam today babe?', delay: 1000 },
      { sender: 'rhea', text: 'ugh don\'t even ask... I think I messed up question 3', delay: 2000 },
      { sender: 'avi', text: 'hey, you studied so hard. I\'m sure you did better than you think', delay: 2500 },
      { sender: 'rhea', text: 'thanks for believing in me ❤️ you always know what to say', delay: 2000 },
      { sender: 'avi', text: 'want me to bring you some ice cream? cookies and cream?', delay: 1500 }
    ]
  },
  {
    name: "Toxic",
    color: "from-red-500 to-orange-500",
    description: "When love becomes complicated",
    context: "You are in a toxic phase. Trust issues have arisen between Avi and Rhea. Show jealousy, cold responses, overthinking, and arguments. Avi tries to hold on but hides emotions. Rhea gets emotionally overwhelmed. Respond with tension, suspicion, and emotional conflict.",
    messages: [
      { sender: 'rhea', text: 'who was that girl you were texting?', delay: 1000 },
      { sender: 'avi', text: 'what girl?', delay: 2000 },
      { sender: 'rhea', text: 'I saw her name pop up on your phone. Sarah?', delay: 1500 },
      { sender: 'avi', text: 'she\'s just a friend from class rhea', delay: 2500 },
      { sender: 'rhea', text: 'just a friend? she was sending heart emojis', delay: 2000 }
    ]
  },
  {
    name: "Breakup",
    color: "from-gray-400 to-gray-600",
    description: "When it's time to let go",
    context: "You are in the breakup phase. Avi and Rhea are confronting their problems and deciding to end things. Show emotional vulnerability, regret, and closure. Keep responses mature and heartbreaking but not overly dramatic. This is about letting go with love.",
    messages: [
      { sender: 'rhea', text: 'we need to talk', delay: 2000 },
      { sender: 'avi', text: 'I know', delay: 2500 },
      { sender: 'rhea', text: 'this isn\'t working anymore, is it?', delay: 3000 },
      { sender: 'avi', text: 'I\'ve been thinking the same thing', delay: 3500 },
      { sender: 'rhea', text: 'we used to be so good together...', delay: 2500 }
    ]
  }
];

function App() {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [nextSender, setNextSender] = useState<'avi' | 'rhea'>('avi');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const genAI = new GoogleGenerativeAI('AIzaSyAxM9fqEa9WR9rbzlxqDKt1C0reNUiS9Dg');

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startPhase = async (phaseIndex: number) => {
    if (isPlaying) return;
    
    setCurrentPhase(phaseIndex);
    setMessages([]);
    setIsPlaying(true);
    setIsInteractive(false);

    const phase = phases[phaseIndex];
    
    for (let i = 0; i < phase.messages.length; i++) {
      await new Promise(resolve => setTimeout(resolve, phase.messages[i].delay || 1000));
      
      const newMessage: Message = {
        id: Date.now() + i,
        ...phase.messages[i],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'read'
      };

      setMessages(prev => [...prev, newMessage]);
    }

    setIsPlaying(false);
    setIsInteractive(true);
    setNextSender(phase.messages[phase.messages.length - 1].sender === 'avi' ? 'rhea' : 'avi');
  };

  const generateAIResponse = async (userMessage: string) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const phase = phases[currentPhase];
      const conversationHistory = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
      
      const prompt = `${phase.context}

Previous conversation:
${conversationHistory}

User just said: "${userMessage}"

You should respond as ${nextSender}. Keep the response:
- Short and realistic (1-2 sentences max)
- True to the character (Avi: soft, calm, hides emotions; Rhea: expressive, loving, gets overwhelmed)
- Appropriate for the ${phase.name} phase
- Natural and conversational
- Use emojis sparingly and appropriately

Respond only with the message text, nothing else.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Error generating AI response:', error);
      return nextSender === 'avi' ? "I'm not sure what to say..." : "hmm... 🤔";
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim() || !isInteractive || isTyping) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      text: userInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'read'
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = userInput;
    setUserInput('');
    setIsTyping(true);

    // Generate AI response
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const aiResponse = await generateAIResponse(currentInput);
    
    const aiMessage: Message = {
      id: Date.now() + 1,
      sender: nextSender,
      text: aiResponse,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'read'
    };

    setMessages(prev => [...prev, aiMessage]);
    setNextSender(nextSender === 'avi' ? 'rhea' : 'avi');
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const MessageBubble = ({ message }: { message: Message }) => {
    const isUser = message.sender === 'user';
    const isAvi = message.sender === 'avi';
    
    if (message.text === '') {
      return (
        <div className="flex justify-center py-4">
          <div className="text-gray-400 text-sm flex items-center gap-1">
            <CheckCheck size={16} />
            <span>Seen</span>
          </div>
        </div>
      );
    }

    return (
      <div className={`flex ${isUser || isAvi ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className="flex flex-col">
          {!isUser && (
            <span className="text-xs text-gray-500 mb-1 px-2">
              {message.sender === 'avi' ? 'Avi' : 'Rhea'}
            </span>
          )}
          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
            isUser
              ? 'bg-green-500 text-white rounded-br-sm'
              : isAvi 
                ? 'bg-blue-500 text-white rounded-br-sm' 
                : 'bg-gray-200 text-gray-800 rounded-bl-sm'
          }`}>
            <p className="text-sm">{message.text}</p>
            <div className={`flex items-center justify-end gap-1 mt-1 ${
              isUser ? 'text-green-200' : isAvi ? 'text-blue-200' : 'text-gray-500'
            }`}>
              <span className="text-xs">{message.timestamp}</span>
              {(isUser || isAvi) && (
                <CheckCheck size={12} className={message.status === 'read' ? 'opacity-100' : 'opacity-60'} />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Avi & Rhea</h1>
          <p className="text-gray-300">Interactive relationship journey - Join their conversation!</p>
        </div>

        {/* Phase Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {phases.map((phase, index) => (
            <button
              key={index}
              onClick={() => startPhase(index)}
              disabled={isPlaying}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                currentPhase === index
                  ? `bg-gradient-to-r ${phase.color} text-white shadow-lg`
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              } ${isPlaying ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
            >
              {phase.name}
            </button>
          ))}
        </div>

        {/* Current Phase Info */}
        <div className="text-center mb-6">
          <div className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r ${phases[currentPhase].color} text-white font-medium`}>
            {phases[currentPhase].name} Phase
          </div>
          <p className="text-gray-400 text-sm mt-2">{phases[currentPhase].description}</p>
          {isInteractive && (
            <p className="text-green-400 text-sm mt-1">💬 Interactive mode - You can now join the conversation!</p>
          )}
        </div>

        {/* Chat Interface */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-t-3xl shadow-2xl">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h3 className="font-semibold">Avi & Rhea {isInteractive && '+ You'}</h3>
                  <p className="text-xs opacity-80">
                    {isTyping ? `${nextSender} is typing...` : isInteractive ? 'online' : isPlaying ? 'replaying...' : 'select a phase'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={chatContainerRef}
              className="h-96 overflow-y-auto p-4 bg-gray-50"
            >
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <Heart size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Select a phase to begin their story</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))
              )}
              
              {isTyping && (
                <div className="flex justify-start mb-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 mb-1 px-2">
                      {nextSender === 'avi' ? 'Avi' : 'Rhea'}
                    </span>
                    <div className="bg-gray-200 rounded-2xl rounded-bl-sm px-4 py-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t bg-white rounded-b-3xl">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={!isInteractive || isTyping}
                  placeholder={
                    !isInteractive 
                      ? "Start a phase to join the conversation..." 
                      : isTyping 
                        ? "Wait for response..." 
                        : "Type your message..."
                  }
                  className="flex-1 bg-gray-100 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button 
                  onClick={sendMessage}
                  disabled={!isInteractive || !userInput.trim() || isTyping}
                  className="w-10 h-10 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors"
                >
                  <Send size={20} className="text-white ml-0.5" />
                </button>
              </div>
              {isInteractive && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  You're chatting with AI-powered Avi and Rhea. Press Enter to send.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        {isInteractive && (
          <div className="text-center mt-6 max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <h3 className="text-white font-semibold mb-2">How to interact:</h3>
              <div className="text-gray-300 text-sm space-y-1">
                <p>• Join the conversation naturally - ask questions, share thoughts, or respond to their messages</p>
                <p>• Each phase has a different dynamic - adapt your tone accordingly</p>
                <p>• The AI will respond as either Avi or Rhea based on the conversation flow</p>
                <p>• Experience how your words can influence their relationship journey</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;