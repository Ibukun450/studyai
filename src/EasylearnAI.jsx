import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Brain, Zap, Crown, MessageCircle, Play, Trash2, Plus, Check, Menu, X, AlertCircle, Copy, Lock, Mail, Phone, MessageSquare, Sparkles, Shield, Clock, Users, RefreshCw, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import * as pdfjsLib from "pdfjs-dist";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// To enable rich formatting for AI responses, please install the following packages:
// npm install react-markdown remark-math rehype-katex
// npm install -D @tailwindcss/typography
//
// Then, add the typography plugin to your tailwind.config.js:
// plugins: [
//   require('@tailwindcss/typography'),
// ],


// Configure PDF.js worker - using jsdelivr CDN for better reliability
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

const EasylearnAI = () => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  
  // Navigation and UI state
  const [activeTab, setActiveTab] = useState('upload');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDocPreview, setShowDocPreview] = useState(true); // Toggle document preview on mobile
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Document management
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  
  // Chat functionality (NEW)
  const [question, setQuestion] = useState('');
  const [chatMessages, setChatMessages] = useState([]); // Array of {role, content, timestamp}
  const chatEndRef = useRef(null); // For auto-scrolling to latest message
  
  // Quiz functionality
  const [quiz, setQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState(null);
  const [showQuizConfig, setShowQuizConfig] = useState(false);
  const [selectedDocForQuiz, setSelectedDocForQuiz] = useState(null);
  const [quizConfig, setQuizConfig] = useState({
    questionCount: 10,
    isTimed: false, // New: To enable/disable the timer
    timeLimit: 300, // New: Time in seconds (e.g., 300s = 5 minutes)
    questionTypes: ['multiple-choice', 'true-false']
  });
  
  // New state to manage the countdown during the quiz
  const [timeLeft, setTimeLeft] = useState(null);

  // New state for batched quiz generation progress
  const [quizGenerationProgress, setQuizGenerationProgress] = useState(null); // { stage, message, current, total }
  
  // Premium features
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activationCode, setActivationCode] = useState('');
  const [isActivated, setIsActivated] = useState(false);
  const [usageStats, setUsageStats] = useState({ uploads: 0, questions: 0, quizzes: 0 });
  const [showContactModal, setShowContactModal] = useState(false);
  
  // Constants
  const API_BASE_URL = "/.netlify/functions";
  const FREE_LIMITS = { uploads: 1, questions: 3, quizzes: 1 };

  // ============================================
  // EFFECTS & LIFECYCLE
  // ============================================
  
  /**
   * Load all saved data from localStorage on component mount
   * This ensures user data persists across sessions
   */
  useEffect(() => {
    // In-memory fallback for environments where localStorage is not available
    const safeLocalStorage = {
      getItem: (key) => {
        try {
          return localStorage.getItem(key);
        } catch {
          console.warn('localStorage is not available. Data will not persist.');
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch {
          // Do nothing if localStorage is not available
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch {
          // Do nothing
        }
      },
       clear: () => {
        try {
          localStorage.clear();
        } catch {
          // Do nothing
        }
      }
    };
    
    const savedStats = safeLocalStorage.getItem('easylearnai_usage');
    const savedActivation = safeLocalStorage.getItem('easylearnai_activated');
    const savedDocuments = safeLocalStorage.getItem('easylearnai_documents');
    const savedSelectedDoc = safeLocalStorage.getItem('easylearnai_selected_doc');
    const savedQuiz = safeLocalStorage.getItem('easylearnai_current_quiz');
    const savedQuizAnswers = safeLocalStorage.getItem('easylearnai_quiz_answers');
    const savedQuizResults = safeLocalStorage.getItem('easylearnai_quiz_results');
    const savedChatMessages = safeLocalStorage.getItem('easylearnai_chat_messages');
    
    if (savedStats) setUsageStats(JSON.parse(savedStats));
    if (savedActivation === 'true') setIsActivated(true);
    if (savedDocuments) setDocuments(JSON.parse(savedDocuments));
    if (savedSelectedDoc) setSelectedDoc(JSON.parse(savedSelectedDoc));
    if (savedQuiz) setQuiz(JSON.parse(savedQuiz));
    if (savedQuizAnswers) setQuizAnswers(JSON.parse(savedQuizAnswers));
    if (savedQuizResults) setQuizResults(JSON.parse(savedQuizResults));
    if (savedChatMessages) setChatMessages(JSON.parse(savedChatMessages));
  }, []);

  /**
   * Auto-scroll chat to bottom when new messages arrive
   */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('easylearnai_usage', JSON.stringify(usageStats));
  }, [usageStats]);

  useEffect(() => {
    localStorage.setItem('easylearnai_documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    if (selectedDoc) {
      localStorage.setItem('easylearnai_selected_doc', JSON.stringify(selectedDoc));
    }
  }, [selectedDoc]);

  useEffect(() => {
    localStorage.setItem('easylearnai_chat_messages', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    if (quiz) {
      localStorage.setItem('easylearnai_current_quiz', JSON.stringify(quiz));
    } else {
      localStorage.removeItem('easylearnai_current_quiz');
    }
  }, [quiz]);

  useEffect(() => {
    localStorage.setItem('easylearnai_quiz_answers', JSON.stringify(quizAnswers));
  }, [quizAnswers]);

  useEffect(() => {
    if (quizResults) {
      localStorage.setItem('easylearnai_quiz_results', JSON.stringify(quizResults));
    } else {
      localStorage.removeItem('easylearnai_quiz_results');
    }
  }, [quizResults]);
/**
   * Handles the quiz timer countdown
   */
  useEffect(() => {
    // Check if the quiz is active, timed, and not yet submitted
    if (quiz?.config.isTimed && quizResults === null) {
      // Set the initial time
      if (timeLeft === null) {
        setTimeLeft(quiz.config.timeLimit);
      }

      // Create an interval to tick down every second
      const timerInterval = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerInterval);
            showToast("Time's up! Submitting your answers.", 'info');
            submitQuiz(); // Auto-submit the quiz
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      // Cleanup function to clear interval when component unmounts or dependencies change
      return () => clearInterval(timerInterval);
    } else {
      // Reset timer when quiz is not active
      setTimeLeft(null);
    }
  }, [quiz, quizResults]);
  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  
  /**
   * Check if user has reached free tier limit for a specific action
   * @param {string} action - 'uploads', 'questions', or 'quizzes'
   * @returns {boolean} - true if limit reached
   */
  const hasReachedLimit = (action) => {
    if (isActivated) return false;
    return usageStats[action] >= FREE_LIMITS[action];
  };

  /**
   * Display a toast notification to the user
   * @param {string} message - Message to display
   * @param {string} type - 'success', 'error', or 'info'
   */
  const showToast = (message, type = 'success') => {
    const msg = document.createElement('div');
    const colorMap = {
      success: { bg: 'bg-green-50 border-green-200', text: 'text-green-800', icon: 'text-green-600' },
      error: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', icon: 'text-red-600' },
      info: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', icon: 'text-blue-600' }
    };
    const colors = colorMap[type] || colorMap.success;
    
    msg.className = `fixed top-4 right-4 ${colors.bg} border rounded-lg p-4 shadow-lg z-50 animate-slide-in`;
    msg.innerHTML = `<div class="flex items-center"><svg class="h-5 w-5 ${colors.icon} mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><p class="text-sm ${colors.text}">${message}</p></div>`;
    document.body.appendChild(msg);
    setTimeout(() => document.body.removeChild(msg), 3000);
  };

  /**
   * Copy text to clipboard with user feedback
   * @param {string} text - Text to copy
   */
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Failed to copy', 'error');
    });
  };

  /**
   * Clear all user data and reset application state
   */
  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This will delete all documents, quiz progress, chat history, and reset your usage stats. This cannot be undone!')) {
      localStorage.clear();
      setDocuments([]);
      setUsageStats({ uploads: 0, questions: 0, quizzes: 0 });
      setIsActivated(false);
      setQuiz(null);
      setQuizAnswers({});
      setQuizResults(null);
      setSelectedDoc(null);
      setChatMessages([]);
      setQuestion('');
      setActiveTab('upload');
      showToast('All data cleared successfully!', 'info');
    }
  };

  /**
   * Clear chat history for current document
   */
  const clearChat = () => {
    if (window.confirm('Clear all chat messages for this document?')) {
      setChatMessages([]);
      showToast('Chat cleared!', 'info');
    }
  };

  // ============================================
  // PREMIUM & ACTIVATION
  // ============================================
  
  /**
   * Validate and activate premium features
   */
  const handleActivation = () => {
    const validCodes = ['EASYLEARN2025', 'PREMIUM123', 'UNLOCKNOW'];
    if (validCodes.includes(activationCode.toUpperCase())) {
      setIsActivated(true);
      localStorage.setItem('easylearnai_activated', 'true');
      setShowActivationModal(false);
      setActivationCode('');
      setError(null);
      showToast('Activation successful! You now have unlimited access.', 'success');
    } else {
      setError('Invalid activation code. Please contact support.');
    }
  };

  // ============================================
  // PDF PROCESSING
  // ============================================
  
  /**
   * Extract text content from PDF file using PDF.js
   * @param {File} file - PDF file to process
   * @returns {Promise<string>} - Extracted text content
   */
  const extractTextFromPDF = async (file) => {
    try {
      setError(null);
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer, 
        isEvalSupported: false, 
        useSystemFonts: true 
      }).promise;
      
      let fullText = "";
      const maxPages = Math.min(pdf.numPages, 50); // Limit to 50 pages for performance
      
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(" ");
        fullText += pageText + "\n\n";
      }
      
      return fullText;
    } catch (error) {
      console.error('PDF extraction error:', error);
      let errorMessage = 'Failed to extract text from PDF. Please try again.';
      
      if (error.name === 'InvalidPDFException') {
        errorMessage = 'Invalid PDF file. Please check the file and try again.';
      } else if (error.message.includes('Worker')) {
        errorMessage = 'PDF processing error. The worker failed to load.';
      }
      
      setError(errorMessage);
      throw error;
    }
  };

  /**
   * Handle file upload and process PDF
   * @param {Event} event - File input change event
   */
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check free tier limits
    if (hasReachedLimit('uploads')) {
      setShowActivationModal(true);
      event.target.value = '';
      return;
    }
    
    // Validate file type and size
    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size too large. Please upload a PDF smaller than 10MB.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const extractedText = await extractTextFromPDF(file);
      
      // Create new document object
      const pdfUrl = URL.createObjectURL(file);
      const newDoc = {
        id: Date.now().toString(),
        name: file.name,
        content: extractedText,
        pdfUrl: pdfUrl, // Add this line
        uploadDate: new Date().toLocaleDateString(),
        size: (file.size / 1024).toFixed(2) + ' KB'
      };
      
      setDocuments(prev => [...prev, newDoc]);
      setSelectedDoc(newDoc);
      setUsageStats(prev => ({ ...prev, uploads: prev.uploads + 1 }));
      event.target.value = ''; // Reset file input
      setActiveTab('documents');
      showToast('Document uploaded successfully!', 'success');
    } catch (error) {
      console.error('File processing error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CHAT & AI FUNCTIONALITY
  // ============================================
  
  /**
   * Send question to AI and handle response
   * Uses chat-style message history
   */
  const askQuestion = async () => {
    if (!selectedDoc || !question.trim()) return;
    
    // Check free tier limits
    if (hasReachedLimit('questions')) {
      setShowActivationModal(true);
      return;
    }

    // Add user message to chat
    const userMessage = { 
      role: 'user', 
      content: question, 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, userMessage]);
    setQuestion(''); // Clear input immediately for better UX
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          context: selectedDoc.content,
          temperature: 0.3,
          max_tokens: 1500
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error?.code === 403) {
          throw new Error('Content was flagged by moderation. Please rephrase your question.');
        }
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add AI response to chat
      const aiMessage = { 
        role: 'assistant', 
        content: data.reply || 'No response received',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, aiMessage]);
      setUsageStats(prev => ({ ...prev, questions: prev.questions + 1 }));
    } catch (err) {
      console.error('AI API error:', err);
      if (err.message.includes('moderation')) {
        setError('Your question was flagged. Try rephrasing it more generally.');
      } else {
        setError('Failed to get AI response. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // QUIZ FUNCTIONALITY
  // ============================================
  
  /**
   * Generate quiz from document content using batching for large quizzes
   * @param {Object} doc - Document to create quiz from
   */
  const generateQuiz = async (doc) => {
    if (hasReachedLimit('quizzes')) {
      setShowActivationModal(true);
      setShowQuizConfig(false);
      return;
    }
    
    const config = quizConfig;
    setError(null);
    setShowQuizConfig(false);
    
    const BATCH_SIZE = 25; // Generate 25 questions per API call
    const numBatches = Math.ceil(config.questionCount / BATCH_SIZE);
    let allQuestions = [];

    try {
      for (let i = 0; i < numBatches; i++) {
        const questionsInBatch = (i === numBatches - 1) 
          ? config.questionCount - (i * BATCH_SIZE) 
          : BATCH_SIZE;

        setQuizGenerationProgress({
            stage: 'batch',
            message: `Generating questions... (Batch ${i + 1} of ${numBatches})`,
            current: i + 1,
            total: numBatches,
        });

        const questionTypeText = config.questionTypes.join(' and ');
        const prompt = `Based on the document content, generate ${questionsInBatch} quiz questions. Include ${questionTypeText} questions.
For any questions or explanations involving mathematical formulas, USE LATEX SYNTAX. Use $...$ for inline math and $$...$$ for block-level equations.

IMPORTANT: For EACH question, you MUST include an "explanation" field that:
1. Explains WHY the correct answer is right
2. References specific information from the document
3. Provides context to help the student learn

Format your response as a valid JSON array of objects with this EXACT structure:
[{
  "question": "question text here",
  "type": "multiple-choice",
  "options": ["option1", "option2", "option3", "option4"],
  "correct": 0,
  "explanation": "Detailed explanation here referencing the document content, explaining why this answer is correct, and using LaTeX for math like $E = mc^2$."
}]

Document content: ${doc.content.substring(0, 15000)}`;
      
        const response = await fetch(`${API_BASE_URL}/ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: prompt, 
                context: '', 
                temperature: 0.7, 
                max_tokens: 8000,
            })
        });

        if (!response.ok) throw new Error(`API error on batch ${i+1}: ${response.status}`);
        
        const data = await response.json();
        let batchQuestions = [];
        try {
            const jsonMatch = data.reply.match(/\[[\s\S]*\]/);
            if (jsonMatch) batchQuestions = JSON.parse(jsonMatch[0]);
        } catch (parseErr) {
            console.error(`Failed to parse quiz JSON for batch ${i + 1}:`, parseErr);
            throw new Error(`The AI returned an invalid format for batch ${i + 1}. Please try again.`);
        }
        
        allQuestions = [...allQuestions, ...batchQuestions];
      }
      
      setQuizGenerationProgress({ stage: 'finalizing', message: 'Finalizing your quiz...', current: numBatches, total: numBatches });

      // Validate and format all questions together
      const validQuestions = allQuestions
        .filter(q => q.question && q.type && q.explanation)
        .slice(0, config.questionCount)
        .map((q, index) => ({ 
          ...q, 
          id: index + 1,
          explanation: q.explanation || 'No explanation provided.'
        }));
      
      if (validQuestions.length < config.questionCount / 2) { // Check if we got a reasonable number of questions
          throw new Error('AI failed to generate a sufficient number of valid questions.');
      }
      
      const generatedQuiz = { 
        title: `Quiz: ${doc.name}`, 
        config: config, 
        questions: validQuestions 
      };
      
      setQuiz(generatedQuiz);
      setQuizAnswers({});
      setQuizResults(null);
      setActiveTab('quiz');
      setUsageStats(prev => ({ ...prev, quizzes: prev.quizzes + 1 }));
      showToast('Quiz generated successfully!', 'success');
    } catch (err) {
      console.error('Quiz generation error:', err);
      setError(`Failed to generate quiz: ${err.message}`);
      setQuiz(null); // Ensure no partial quiz is shown
    } finally {
      setQuizGenerationProgress(null);
    }
  };


    // Helper function to format seconds into MM:SS
      const formatTime = (seconds) => {
        if (seconds === null || seconds < 0) return '00:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
      };
  /**
   * Handle quiz answer selection
   * @param {number} questionId - Question ID
   * @param {any} answer - Selected answer
   */
  const handleQuizAnswer = (questionId, answer) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  /**
   * Submit quiz and calculate results
   */
  const submitQuiz = () => {
    if (!quiz) return;
    
    let correct = 0;
    quiz.questions.forEach(q => {
      // For true/false, quizAnswers stores boolean but q.correct can be string "true" or boolean.
      const isCorrect = String(quizAnswers[q.id]).toLowerCase() === String(q.correct).toLowerCase();
      if (isCorrect) {
          correct++;
      } else if (q.type === 'multiple-choice' && quizAnswers[q.id] === q.correct) {
          correct++;
      }
    });
    
    const percentage = Math.round((correct / quiz.questions.length) * 100);
    setQuizResults({ correct, total: quiz.questions.length, percentage });
    showToast(`Quiz submitted! You scored ${percentage}%`, 'success');
  };

  /**
   * Delete document from library
   * @param {string} docId - Document ID to delete
   */
  const deleteDocument = (docId) => {
    if (window.confirm('Delete this document? This action cannot be undone.')) {
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
      if (selectedDoc && selectedDoc.id === docId) {
        setSelectedDoc(null);
        setChatMessages([]);
      }
      showToast('Document deleted', 'info');
    }
  };

  // ============================================
  // RENDER COMPONENT
  // ============================================
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ============================================ */}
      {/* MODALS & OVERLAYS */}
      {/* ============================================ */}

      {/* Floating Timer Widget */}
      {quiz?.config.isTimed && quizResults === null && timeLeft !== null && (
        <div className={`fixed bottom-4 right-4 bg-white rounded-lg shadow-xl p-3 z-50 border-2 w-40 text-center transition-colors
          ${timeLeft < 60 ? 'border-red-500' : timeLeft < 120 ? 'border-yellow-500' : 'border-green-500'}`}
        >
          <div className="flex items-center justify-center text-sm font-medium text-gray-600 mb-1">
            <Clock className="h-4 w-4 mr-2" />
            Time Left
          </div>
          <span className={`font-mono text-3xl font-bold tracking-widest ${
            timeLeft < 60 ? 'text-red-600 animate-pulse' : timeLeft < 120 ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      )}

      {/* Quiz Generation Progress Modal */}
      {quizGenerationProgress && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Your Quiz...</h3>
                  <p className="text-sm text-gray-600 mb-4">{quizGenerationProgress.message}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
                          style={{ width: `${(quizGenerationProgress.current / quizGenerationProgress.total) * 100}%` }}
                      ></div>
                  </div>
              </div>
          </div>
      )}

      {/* Error Notification - Fixed position, mobile responsive */}
      {error && (
        <div className="fixed top-4 right-4 left-4 md:left-auto md:w-96 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-3 text-red-400 hover:text-red-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Activation Modal - Centered on all screens */}
      {showActivationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <Lock className="h-12 w-12 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Upgrade to Premium</h3>
              <p className="text-sm text-gray-600 text-center mb-4">You've reached the free tier limit. Enter an activation code to unlock unlimited access.</p>
              
              {/* Usage stats display */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-xs font-medium text-gray-700 mb-2">Current Usage:</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Documents uploaded:</span>
                    <span className="font-medium">{usageStats.uploads}/{FREE_LIMITS.uploads}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Questions asked:</span>
                    <span className="font-medium">{usageStats.questions}/{FREE_LIMITS.questions}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Quizzes generated:</span>
                    <span className="font-medium">{usageStats.quizzes}/{FREE_LIMITS.quizzes}</span>
                  </div>
                </div>
              </div>
              
              <input 
                type="text" 
                value={activationCode} 
                onChange={(e) => setActivationCode(e.target.value)} 
                placeholder="Enter activation code" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4" 
              />
              
              <div className="flex flex-col space-y-2">
                <button onClick={handleActivation} className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors">
                  Activate Premium
                </button>
                <button onClick={() => setShowContactModal(true)} className="w-full px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors">
                  Get Activation Code
                </button>
                <button onClick={() => setShowActivationModal(false)} className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal - Mobile responsive */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Us for Premium Access</h3>
              <p className="text-sm text-gray-600 mb-6">Get your activation code and unlock unlimited access to EasylearnAI Premium.</p>
              
              {/* Contact options */}
              <div className="space-y-4">
                <a href="https://wa.me/2347069928785" target="_blank" rel="noopener noreferrer" className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <MessageSquare className="h-6 w-6 text-green-600 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">WhatsApp</p>
                    <p className="text-xs text-gray-600">Chat with us instantly</p>
                  </div>
                </a>
                <a href="mailto:dibukun45@gmail.com" className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <Mail className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <p className="text-xs text-gray-600">dibukun45@gmail.com</p>
                  </div>
                </a>
                <a href="tel:+2347069928785" className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <Phone className="h-6 w-6 text-purple-600 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Phone</p>
                    <p className="text-xs text-gray-600">+234 706 992 8785</p>
                  </div>
                </a>
              </div>
              
              <button 
                onClick={() => { setShowContactModal(false); setShowActivationModal(false); }} 
                className="w-full mt-6 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Configuration Modal */}
      {showQuizConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configure Your Quiz</h3>
              
              <div className="space-y-4">
                {/* Question count selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Questions</label>
                  <select 
                    value={quizConfig.questionCount} 
                    onChange={(e) => setQuizConfig(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                      <option value={5}>5 Questions</option>
                      <option value={10}>10 Questions</option>
                      <option value={15}>15 Questions</option>
                      <option value={20}>20 Questions</option>
                      <option value={25}>25 Questions</option>
                      <option value={30}>30 Questions</option>
                      <option value={40}>40 Questions</option>
                      <option value={50}>50 Questions</option>
                  </select>
                </div>
                
               {/* Timer Configuration */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">Quiz Timer</label>
  <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
    <span className="text-sm text-gray-800">Enable Timer</span>
    {/* Simple Toggle Switch */}
    <label htmlFor="timer-toggle" className="relative inline-flex items-center cursor-pointer">
      <input 
        type="checkbox" 
        id="timer-toggle" 
        className="sr-only peer" 
        checked={quizConfig.isTimed}
        onChange={(e) => setQuizConfig(prev => ({ ...prev, isTimed: e.target.checked }))}
      />
      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
    </label>
  </div>
  
  {/* Conditionally render the time limit selector */}
  {quizConfig.isTimed && (
    <div className="mt-3">
      <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit</label>
      <select 
        value={quizConfig.timeLimit} 
        onChange={(e) => setQuizConfig(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))} 
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value={180}>3 Minutes</option>
        <option value={300}>5 Minutes</option>
        <option value={600}>10 Minutes</option>
        <option value={900}>15 Minutes</option>
      </select>
    </div>
  )}
</div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  onClick={() => setShowQuizConfig(false)} 
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => generateQuiz(selectedDocForQuiz)} 
                  disabled={loading} 
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  Generate Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* HEADER - Sticky navigation with mobile menu */}
      {/* ============================================ */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo and branding */}
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-indigo-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">EasylearnAI</h1>
              {isActivated && (
                <span className="ml-2 px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                  PREMIUM
                </span>
              )}
            </div>
            
            {/* Usage stats - Desktop only */}
            {!isActivated && (
              <div className="hidden md:flex items-center space-x-4 mr-4">
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Usage:</span>
                  <span className="ml-2">{usageStats.uploads}/{FREE_LIMITS.uploads} uploads</span>
                  <span className="ml-2">•</span>
                  <span className="ml-2">{usageStats.questions}/{FREE_LIMITS.questions} Q&A</span>
                  <span className="ml-2">•</span>
                  <span className="ml-2">{usageStats.quizzes}/{FREE_LIMITS.quizzes} quizzes</span>
                </div>
                <button 
                  onClick={clearAllData} 
                  className="text-gray-400 hover:text-red-500 transition-colors" 
                  title="Clear all data"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            )}
            
            {/* Desktop navigation */}
            <nav className="hidden md:flex space-x-4">
              <button 
                onClick={() => setActiveTab('upload')} 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'upload' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Upload className="h-4 w-4 inline mr-2" />Upload
              </button>
              <button 
                onClick={() => setActiveTab('documents')} 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'documents' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <FileText className="h-4 w-4 inline mr-2" />Documents
              </button>
              <button 
                onClick={() => setActiveTab('qa')} 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'qa' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <MessageCircle className="h-4 w-4 inline mr-2" />Q&A
              </button>
              <button 
                onClick={() => setActiveTab('quiz')} 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'quiz' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Play className="h-4 w-4 inline mr-2" />Quiz
              </button>
              <button 
                onClick={() => setActiveTab('pricing')} 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'pricing' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Crown className="h-4 w-4 inline mr-2" />Upgrade
              </button>
            </nav>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
              >
                {mobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
              </button>
            </div>
          </div>
          
          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-3 border-t border-gray-200 mt-2">
              {!isActivated && (
                <div className="px-2 py-2 mb-2 bg-gray-50 rounded-md text-xs text-gray-600">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium mb-1">Usage:</div>
                      <div>{usageStats.uploads}/{FREE_LIMITS.uploads} uploads • {usageStats.questions}/{FREE_LIMITS.questions} Q&A • {usageStats.quizzes}/{FREE_LIMITS.quizzes} quizzes</div>
                    </div>
                    <button 
                      onClick={clearAllData} 
                      className="text-gray-400 hover:text-red-500 ml-2 transition-colors" 
                      title="Clear all data"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Mobile navigation items */}
              <button 
                onClick={() => { setActiveTab('upload'); setMobileMenuOpen(false); }} 
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'upload' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}
              >
                <Upload className="h-4 w-4 inline mr-2" />Upload
              </button>
              <button 
                onClick={() => { setActiveTab('documents'); setMobileMenuOpen(false); }} 
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'documents' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}
              >
                <FileText className="h-4 w-4 inline mr-2" />Documents
              </button>
              <button 
                onClick={() => { setActiveTab('qa'); setMobileMenuOpen(false); }} 
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'qa' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}
              >
                <MessageCircle className="h-4 w-4 inline mr-2" />Q&A
              </button>
              <button 
                onClick={() => { setActiveTab('quiz'); setMobileMenuOpen(false); }} 
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'quiz' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}
              >
                <Play className="h-4 w-4 inline mr-2" />Quiz
              </button>
              <button 
                onClick={() => { setActiveTab('pricing'); setMobileMenuOpen(false); }} 
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'pricing' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}
              >
                <Crown className="h-4 w-4 inline mr-2" />Upgrade
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ============================================ */}
      {/* MAIN CONTENT - Full height with scroll */}
      {/* ============================================ */}
      <main className="h-[calc(100vh-73px)] overflow-hidden">
        
        {/* UPLOAD TAB */}
        {activeTab === 'upload' && (
          <div className="h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
                <div className="text-center">
                  <Upload className="h-12 sm:h-16 w-12 sm:w-16 text-indigo-600 mx-auto mb-4" />
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Upload Your Study Materials</h2>
                  <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">Upload PDF documents to get started with AI-powered study assistance</p>
                  
                  {/* File upload area */}
                  <label className="cursor-pointer block">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 sm:p-12 hover:border-indigo-500 transition-colors">
                      <FileText className="h-10 sm:h-12 w-10 sm:w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-base sm:text-lg font-medium text-gray-700 mb-2">Click to upload or drag and drop</p>
                      <p className="text-xs sm:text-sm text-gray-500">PDF files only (Max 10MB)</p>
                    </div>
                    <input 
                      type="file" 
                      accept="application/pdf" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      disabled={loading} 
                    />
                  </label>
                  
                  {/* Loading indicator */}
                  {loading && (
                    <div className="mt-6 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      <span className="ml-3 text-sm sm:text-base text-gray-600">Processing your PDF...</span>
                    </div>
                  )}
                  
                  {/* Free tier info */}
                  {!isActivated && (
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        Free tier: {FREE_LIMITS.uploads - usageStats.uploads} upload{FREE_LIMITS.uploads - usageStats.uploads !== 1 ? 's' : ''} remaining
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <div className="h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
                <h2 className="text-2xl font-bold text-gray-900">Your Documents</h2>
                <span className="text-sm text-gray-500">{documents.length} document{documents.length !== 1 ? 's' : ''}</span>
              </div>
              
              {documents.length === 0 ? (
                /* Empty state */
                <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center">
                  <FileText className="h-12 sm:h-16 w-12 sm:w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-base sm:text-lg text-gray-600 mb-4">No documents uploaded yet</p>
                  <button 
                    onClick={() => setActiveTab('upload')} 
                    className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="h-5 w-5 mr-2" />Upload your first document
                  </button>
                </div>
              ) : (
                /* Document grid - Responsive columns */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {documents.map((doc) => (
                    <div key={doc.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center flex-1 min-w-0">
                          <FileText className="h-6 sm:h-8 w-6 sm:w-8 text-red-500 mr-2 sm:mr-3 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base">{doc.name}</h3>
                            <p className="text-xs sm:text-sm text-gray-500">{doc.uploadDate}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => deleteDocument(doc.id)} 
                          className="text-gray-400 hover:text-red-500 ml-2 transition-colors"
                        >
                          <Trash2 className="h-4 sm:h-5 w-4 sm:w-5" />
                        </button>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="space-y-2">
                        <button 
                          onClick={() => { setSelectedDocForQuiz(doc); setShowQuizConfig(true); }} 
                          disabled={loading} 
                          className="w-full inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                          <Zap className="h-3 sm:h-4 w-3 sm:w-4 mr-2" />Generate Quiz
                        </button>
                        <button 
                          onClick={() => { 
                            setSelectedDoc(doc); 
                            setChatMessages([]); 
                            setActiveTab('qa'); 
                          }} 
                          className="w-full inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <MessageCircle className="h-3 sm:h-4 w-3 sm:w-4 mr-2" />Ask Questions
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* Q&A TAB - NEW CHAT INTERFACE */}
        {/* Split-screen on desktop, toggle on mobile */}
        {/* ============================================ */}
        {activeTab === 'qa' && (
          <div className="h-full flex flex-col lg:flex-row">
            
            {/* LEFT PANEL - Document Preview */}
            <div className={`${showDocPreview ? 'flex' : 'hidden'} lg:flex flex-col w-full lg:w-1/2 border-r border-gray-200 bg-white`}>
              {/* Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-semibold text-gray-900">Document</h3>
                </div>
                <button 
                  onClick={() => setShowDocPreview(false)} 
                  className="lg:hidden p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {!selectedDoc ? (
                  /* No document selected state */
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <FileText className="h-12 sm:h-16 w-12 sm:w-16 text-gray-300 mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Document Selected</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mb-4">Select a document from your library to start asking questions</p>
                    <button 
                      onClick={() => setActiveTab('documents')} 
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm transition-colors"
                    >
                      View Documents
                    </button>
                  </div>
                ) : (
                  /* Document preview */
                  <div>
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 mb-4">
                     <h4 className="font-semibold text-gray-900 mb-2 text-xs sm:text-sm truncate">{selectedDoc.name}</h4>
                      <div className="flex items-center text-xs sm:text-sm text-gray-600 space-x-4">
                        <span>{selectedDoc.uploadDate}</span>
                        <span>•</span>
                        <span>{selectedDoc.size}</span>
                      </div>
                    </div>
                    
                  {/* Document content preview */}
                      {/* Document content preview */}
<div className="w-full h-full text-center p-4">
    <p className="text-sm text-gray-600 mb-4 lg:hidden">
      PDF preview may not load on mobile. Please use the button below.
    </p>
    {/* Link to open in new tab (good for mobile) */}
    <a
      href={selectedDoc.pdfUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="lg:hidden inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm transition-colors"
    >
      <FileText className="h-4 w-4 mr-2" />
      Open PDF in New Tab
    </a>
    {/* Iframe for desktop */}
    <iframe
      src={selectedDoc.pdfUrl}
      className="hidden lg:block w-full h-[calc(100vh-200px)] border-0 rounded-lg"
      title="PDF Preview"
    />
</div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT PANEL - Chat Interface */}
            <div className={`${!showDocPreview ? 'flex' : 'hidden'} lg:flex flex-col h-full w-full lg:w-1/2 bg-white`}>
              {/* Chat header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600 flex-shrink-0">
                <button 
                  onClick={() => setShowDocPreview(true)} 
                  className="lg:hidden p-2 text-white hover:text-indigo-100 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center space-x-2 flex-1">
                  <Brain className="h-5 w-5 text-white" />
                  <h3 className="font-semibold text-white">EasylearnAI Assistant</h3>
                </div>
                {chatMessages.length > 0 && (
                  <button 
                    onClick={clearChat} 
                    className="text-white hover:text-indigo-100 text-xs sm:text-sm transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Chat messages area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!selectedDoc ? (
                  /* No document selected */
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center p-8">
                      <MessageCircle className="h-12 sm:h-16 w-12 sm:w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-sm sm:text-base text-gray-500">Select a document to start chatting</p>
                    </div>
                  </div>
                ) : chatMessages.length === 0 ? (
                  /* Welcome screen with suggestions */
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center p-4 sm:p-8 max-w-md">
                      <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full p-4 sm:p-6 inline-block mb-4">
                        <Brain className="h-8 sm:h-12 w-8 sm:w-12 text-indigo-600" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Start a Conversation</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-4">Ask me anything about your document!</p>
                      
                      {/* Suggestion chips */}
                      <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                        {['What are the main topics?', 'Explain key concepts', 'Create a summary'].map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => setQuestion(suggestion)}
                            className="text-left px-3 sm:px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs sm:text-sm text-gray-700 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Chat messages
                  <>
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900'} rounded-lg p-3 shadow-sm`}>
                          <div className="flex items-start space-x-2">
                            {msg.role === 'assistant' && (
                              <Brain className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              {msg.role === 'user' ? (
                                <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                              ) : (
                                <div className="prose prose-sm max-w-none text-gray-900">
                                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                    {msg.content}
                                  </ReactMarkdown>
                                </div>
                              )}
                              <div className="flex items-center justify-between mt-1">
                                <span className={`text-xs ${msg.role === 'user' ? 'text-indigo-200' : 'text-gray-500'}`}>
                                  {msg.timestamp}
                                </span>
                                {msg.role === 'assistant' && (
                                  <button
                                    onClick={() => copyToClipboard(msg.content)}
                                    className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                                  >
                                    <Copy className="h-3 w-3 text-gray-600" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Loading indicator */}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg p-3 shadow-sm">
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                            <span className="text-xs sm:text-sm text-gray-600">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Auto-scroll anchor */}
                    <div ref={chatEndRef} />
                  </>
                )
              }
              </div>

              {/* Chat input area */}
              {selectedDoc && (
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                  {!isActivated && (
                    <div className="mb-2 text-xs text-gray-500 text-center">
                      {FREE_LIMITS.questions - usageStats.questions} question{FREE_LIMITS.questions - usageStats.questions !== 1 ? 's' : ''} remaining
                    </div>
                  )}
                  
                  <form 
                    onSubmit={(e) => { e.preventDefault(); askQuestion(); }} 
                    className="flex items-end space-x-2"
                  >
                    <div className="flex-1">
                      <textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            askQuestion();
                          }
                        }}
                        placeholder="Ask anything about your document..."
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm sm:text-base"
                        rows="2"
                        disabled={loading}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !question.trim()}
                      className="px-3 sm:px-4 py-2 sm:py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                    >
                      <Send className="h-4 sm:h-5 w-4 sm:w-5" />
                    </button>
                  </form>
                  
                  <p className="mt-2 text-xs text-gray-500 text-center">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* QUIZ TAB */}
        {activeTab === 'quiz' && (
          <div className="h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-4xl mx-auto">
              {!quiz ? (
                // No quiz state
                <div className="text-center bg-white rounded-lg shadow-md p-8 sm:p-12">
                  <Play className="h-12 sm:h-16 w-12 sm:w-16 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Generate a Quiz</h2>
                  <p className="text-sm sm:text-base text-gray-600 mb-6">Select a document from your library to generate an interactive quiz</p>
                  <button 
                    onClick={() => setActiveTab('documents')} 
                    className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                  >
                    View Documents
                  </button>
                </div>
              ) : (
                // Quiz display
                <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{quiz.title}</h2>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        {quiz.questions.length} questions • {quiz.config.isTimed ? `${quiz.config.timeLimit / 60} minute timer` : 'No timer'}
                      </p>
                    </div>
                    {quizResults && (
                      <div className="text-center sm:text-right">
                        <div className="text-2xl sm:text-3xl font-bold text-indigo-600">{quizResults.percentage}%</div>
                        <div className="text-xs sm:text-sm text-gray-500">{quizResults.correct} of {quizResults.total} correct</div>
                      </div>
                    )}
                  </div>
                  
                  {/* Quiz questions */}
                  <div className="space-y-6">
                    {quiz.questions.map((q, index) => (
                      <div key={q.id} className="border border-gray-200 rounded-lg p-4 sm:p-6">
                        <div className="text-sm sm:text-lg font-medium text-gray-900 mb-4 prose prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {`${index + 1}. ${q.question}`}
                            </ReactMarkdown>
                        </div>
                        
                        {/* Multiple choice questions */}
                        {q.type === 'multiple-choice' && (
                          <div className="space-y-3">
                            {q.options.map((option, optionIndex) => (
                              <label key={optionIndex} className="flex items-start space-x-3 cursor-pointer">
                                <input 
                                  type="radio" 
                                  name={`question-${q.id}`} 
                                  value={optionIndex} 
                                  checked={quizAnswers[q.id] === optionIndex} 
                                  onChange={() => handleQuizAnswer(q.id, optionIndex)} 
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 mt-1" 
                                  disabled={!!quizResults} 
                                />
                                <span className={`flex-1 text-xs sm:text-base ${
                                  quizResults && optionIndex === q.correct 
                                    ? 'text-green-600 font-medium' 
                                    : quizResults && quizAnswers[q.id] === optionIndex && optionIndex !== q.correct 
                                    ? 'text-red-600' 
                                    : 'text-gray-700'
                                }`}>
                                  {option}
                                  {quizResults && optionIndex === q.correct && (
                                    <Check className="h-4 sm:h-5 w-4 sm:w-5 inline ml-2 text-green-600" />
                                  )}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                        
                        {/* True/false questions */}
                        {q.type === 'true-false' && (
                          <div className="space-y-3">
                            {[true, false].map((value, idx) => (
                              <label key={idx} className="flex items-center space-x-3 cursor-pointer">
                                <input 
                                  type="radio" 
                                  name={`question-${q.id}`} 
                                  value={String(value)}
                                  checked={String(quizAnswers[q.id]) === String(value)} 
                                  onChange={() => handleQuizAnswer(q.id, value)} 
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300" 
                                  disabled={!!quizResults} 
                                />
                                <span className={`text-xs sm:text-base ${
                                  quizResults && String(value) === String(q.correct)
                                    ? 'text-green-600 font-medium' 
                                    : quizResults && String(quizAnswers[q.id]) === String(value) && String(value) !== String(q.correct)
                                    ? 'text-red-600' 
                                    : 'text-gray-700'
                                }`}>
                                  {value ? 'True' : 'False'}
                                  {quizResults && String(value) === String(q.correct) && (
                                    <Check className="h-4 sm:h-5 w-4 sm:w-5 inline ml-2 text-green-600" />
                                  )}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                        
                        {/* Explanation - shown after submission */}
                        {quizResults && q.explanation && (
                          <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                            <div className="flex items-start">
                              <Brain className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                              <div className="prose prose-sm max-w-none">
                                <p className="text-xs sm:text-sm font-medium text-blue-900 mb-1">Explanation:</p>
                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                  {q.explanation}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Quiz actions */}
                  <div className="mt-8 flex flex-col sm:flex-row justify-between gap-3">
                    <button 
                      onClick={() => { setQuiz(null); setActiveTab('documents'); }} 
                      className="px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm sm:text-base transition-colors"
                    >
                      Back to Documents
                    </button>
                    {!quizResults ? (
                      <button 
                        onClick={submitQuiz} 
                        className="px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm sm:text-base transition-colors"
                      >
                        Submit Quiz
                      </button>
                    ) : (
                      <button 
                        onClick={() => { setQuizAnswers({}); setQuizResults(null); }} 
                        className="px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm sm:text-base transition-colors"
                      >
                        Retake Quiz
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PRICING TAB */}
        {activeTab === 'pricing' && (
          <div className="h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Unlock Your Study Potential</h2>
                <p className="text-base sm:text-lg text-gray-600">Choose the plan that fits your learning journey</p>
              </div>
              
              {/* Pricing cards - Responsive grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-12">
                {/* Free tier card */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-200">
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Free</h3>
                      <Shield className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="mb-6">
                      <span className="text-3xl sm:text-4xl font-bold text-gray-900">₦0</span>
                      <span className="text-gray-500">/month</span>
                    </div>
                    <ul className="space-y-4 mb-8">
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base text-gray-700">{FREE_LIMITS.uploads} document upload per month</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base text-gray-700">{FREE_LIMITS.questions} AI-powered Q&A sessions</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base text-gray-700">{FREE_LIMITS.quizzes} quiz generation</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base text-gray-700">Basic PDF text extraction</span>
                      </li>
                    </ul>
                    <button 
                      disabled 
                      className="w-full py-3 px-6 rounded-lg font-medium bg-gray-100 text-gray-500 cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  </div>
                </div>
                
                {/* Premium card */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-2xl overflow-hidden border-2 border-indigo-400 transform lg:scale-105">
                  <div className="bg-yellow-400 text-center py-2">
                    <span className="text-sm font-bold text-gray-900">⭐ MOST POPULAR</span>
                  </div>
                  <div className="p-6 sm:p-8 text-white">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl sm:text-2xl font-bold">Premium</h3>
                      <Crown className="h-8 w-8 text-yellow-300" />
                    </div>
                    <div className="mb-6">
                      <span className="text-3xl sm:text-4xl font-bold">₦1,000</span>
                      <span className="text-indigo-200">/month</span>
                    </div>
                    <ul className="space-y-4 mb-8">
                      <li className="flex items-start">
                        <Sparkles className="h-5 w-5 text-yellow-300 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base"><strong>Unlimited</strong> document uploads</span>
                      </li>
                      <li className="flex items-start">
                        <Sparkles className="h-5 w-5 text-yellow-300 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base"><strong>Unlimited</strong> AI Q&A sessions</span>
                      </li>
                      <li className="flex items-start">
                        <Sparkles className="h-5 w-5 text-yellow-300 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base"><strong>Unlimited</strong> quiz generations</span>
                      </li>
                      <li className="flex items-start">
                        <Clock className="h-5 w-5 text-yellow-300 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base">Priority AI response times</span>
                      </li>
                      <li className="flex items-start">
                        <Brain className="h-5 w-5 text-yellow-300 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base">Advanced question difficulty levels</span>
                      </li>
                      <li className="flex items-start">
                        <Users className="h-5 w-5 text-yellow-300 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base">24/7 Premium support</span>
                      </li>
                    </ul>
                    <button 
                      onClick={() => setShowContactModal(true)} 
                      className="w-full py-3 px-6 rounded-lg font-medium bg-white text-indigo-600 hover:bg-gray-100 transition-colors"
                    >
                      Get Premium Access
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Contact CTA section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 sm:p-8 border border-indigo-200">
                <div className="text-center">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Ready to Upgrade Your Learning?</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-6">Contact us to get your activation code and unlock premium features instantly</p>
                  <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                    <a 
                      href="https://wa.me/2347069928785" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
                    >
                      <MessageSquare className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />WhatsApp Us
                    </a>
                    <a 
                      href="mailto:dibukun45@gmail.com" 
                      className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
                    >
                      <Mail className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />Email Us
                    </a>
                    <a 
                      href="tel:+2347069928785" 
                      className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
                    >
                      <Phone className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />Call Us
                    </a>
                  </div>
                </div>
              </div>
              
              {/* FAQ section */}
              <div className="mt-12">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-6 text-center">Frequently Asked Questions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-white rounded-lg p-4 sm:p-6 shadow">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">How do I activate Premium?</h4>
                    <p className="text-xs sm:text-sm text-gray-600">Contact us through any method above to receive your activation code. Enter it in the app to unlock all features instantly.</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 sm:p-6 shadow">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Can I try before upgrading?</h4>
                    <p className="text-xs sm:text-sm text-gray-600">Yes! The free tier lets you test all features with limited usage. Upgrade anytime when you're ready for unlimited access.</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 sm:p-6 shadow">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">What payment methods do you accept?</h4>
                    <p className="text-xs sm:text-sm text-gray-600">We accept bank transfers, mobile money, and other local payment methods. Contact us for details specific to your region.</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 sm:p-6 shadow">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Is my data secure?</h4>
                    <p className="text-xs sm:text-sm text-gray-600">Absolutely! All your documents and data are stored securely on your device using your browser's local storage and are never shared with third parties.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default EasylearnAI;