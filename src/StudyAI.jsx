import React, { useState, useEffect } from 'react';
import { Upload, FileText, Brain, Zap, Crown, MessageCircle, Play, Trash2, Plus, Check, Menu, X, AlertCircle, Copy, Lock, Mail, Phone, MessageSquare, Sparkles, Shield, Clock, Users, RefreshCw } from 'lucide-react';
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const StudyAI = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showQuizConfig, setShowQuizConfig] = useState(false);
  const [selectedDocForQuiz, setSelectedDocForQuiz] = useState(null);
  const [error, setError] = useState(null);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activationCode, setActivationCode] = useState('');
  const [isActivated, setIsActivated] = useState(false);
  const [usageStats, setUsageStats] = useState({ uploads: 0, questions: 0, quizzes: 0 });
  const [showContactModal, setShowContactModal] = useState(false);
  const [quizConfig, setQuizConfig] = useState({
    questionCount: 5,
    difficulty: 'medium',
    questionTypes: ['multiple-choice', 'true-false']
  });
  
  const API_BASE_URL = "/.netlify/functions";
  const FREE_LIMITS = { uploads: 1, questions: 3, quizzes: 1 };

  // Load ALL data on mount
  useEffect(() => {
    const savedStats = localStorage.getItem('studyai_usage');
    const savedActivation = localStorage.getItem('studyai_activated');
    const savedDocuments = localStorage.getItem('studyai_documents');
    const savedSelectedDoc = localStorage.getItem('studyai_selected_doc');
    const savedQuiz = localStorage.getItem('studyai_current_quiz');
    const savedQuizAnswers = localStorage.getItem('studyai_quiz_answers');
    const savedQuizResults = localStorage.getItem('studyai_quiz_results');
    const savedAnswer = localStorage.getItem('studyai_last_answer');
    const savedQuestion = localStorage.getItem('studyai_last_question');
    
    if (savedStats) setUsageStats(JSON.parse(savedStats));
    if (savedActivation === 'true') setIsActivated(true);
    if (savedDocuments) setDocuments(JSON.parse(savedDocuments));
    if (savedSelectedDoc) setSelectedDoc(JSON.parse(savedSelectedDoc));
    if (savedQuiz) setQuiz(JSON.parse(savedQuiz));
    if (savedQuizAnswers) setQuizAnswers(JSON.parse(savedQuizAnswers));
    if (savedQuizResults) setQuizResults(JSON.parse(savedQuizResults));
    if (savedAnswer) setAnswer(savedAnswer);
    if (savedQuestion) setQuestion(savedQuestion);
  }, []);

  // Save usage stats
  useEffect(() => {
    localStorage.setItem('studyai_usage', JSON.stringify(usageStats));
  }, [usageStats]);

  // Save documents
  useEffect(() => {
    localStorage.setItem('studyai_documents', JSON.stringify(documents));
  }, [documents]);

  // Save selected document
  useEffect(() => {
    if (selectedDoc) {
      localStorage.setItem('studyai_selected_doc', JSON.stringify(selectedDoc));
    }
  }, [selectedDoc]);

  // Save quiz state
  useEffect(() => {
    if (quiz) {
      localStorage.setItem('studyai_current_quiz', JSON.stringify(quiz));
    } else {
      localStorage.removeItem('studyai_current_quiz');
    }
  }, [quiz]);

  // Save quiz answers
  useEffect(() => {
    localStorage.setItem('studyai_quiz_answers', JSON.stringify(quizAnswers));
  }, [quizAnswers]);

  // Save quiz results
  useEffect(() => {
    if (quizResults) {
      localStorage.setItem('studyai_quiz_results', JSON.stringify(quizResults));
    } else {
      localStorage.removeItem('studyai_quiz_results');
    }
  }, [quizResults]);

  // Save Q&A
  useEffect(() => {
    if (answer) localStorage.setItem('studyai_last_answer', answer);
    if (question) localStorage.setItem('studyai_last_question', question);
  }, [answer, question]);

  const hasReachedLimit = (action) => {
    if (isActivated) return false;
    return usageStats[action] >= FREE_LIMITS[action];
  };

  const handleActivation = () => {
    const validCodes = ['STUDYAI2024', 'PREMIUM123', 'UNLOCK999'];
    if (validCodes.includes(activationCode.toUpperCase())) {
      setIsActivated(true);
      localStorage.setItem('studyai_activated', 'true');
      setShowActivationModal(false);
      setActivationCode('');
      setError(null);
      const msg = document.createElement('div');
      msg.className = 'fixed top-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg z-50';
      msg.innerHTML = '<div class="flex items-center"><svg class="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><p class="text-sm text-green-800">Activation successful!</p></div>';
      document.body.appendChild(msg);
      setTimeout(() => document.body.removeChild(msg), 3000);
    } else {
      setError('Invalid activation code. Please contact support.');
    }
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This will delete all documents, quiz progress, and reset your usage stats. This cannot be undone!')) {
      localStorage.clear();
      setDocuments([]);
      setUsageStats({ uploads: 0, questions: 0, quizzes: 0 });
      setIsActivated(false);
      setQuiz(null);
      setQuizAnswers({});
      setQuizResults(null);
      setSelectedDoc(null);
      setAnswer('');
      setQuestion('');
      setActiveTab('upload');
      const msg = document.createElement('div');
      msg.className = 'fixed top-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg z-50';
      msg.innerHTML = '<div class="flex items-center"><svg class="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg><p class="text-sm text-blue-800">All data cleared successfully!</p></div>';
      document.body.appendChild(msg);
      setTimeout(() => document.body.removeChild(msg), 3000);
    }
  };

  const formatAIResponse = (text) => {
    if (!text) return '';
    let formatted = text
      .replace(/^\d+\.\s/gm, '\n• ')
      .replace(/^[-*]\s/gm, '• ')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
    return `<p>${formatted}</p>`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      const msg = document.createElement('div');
      msg.className = 'fixed top-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg z-50';
      msg.innerHTML = '<div class="flex items-center"><svg class="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><p class="text-sm text-green-800">Copied!</p></div>';
      document.body.appendChild(msg);
      setTimeout(() => document.body.removeChild(msg), 2000);
    });
  };

  const extractTextFromPDF = async (file) => {
    try {
      setError(null);
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer, isEvalSupported: false, useSystemFonts: true }).promise;
      let fullText = "";
      const maxPages = Math.min(pdf.numPages, 50);
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
        errorMessage = 'PDF processing error. Please try again with a different file.';
      }
      setError(errorMessage);
      throw error;
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (hasReachedLimit('uploads')) {
      setShowActivationModal(true);
      event.target.value = '';
      return;
    }
    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size too large. Please upload a PDF smaller than 10MB.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const extractedText = await extractTextFromPDF(file);
      const newDoc = {
        id: Date.now().toString(),
        name: file.name,
        content: extractedText,
        uploadDate: new Date().toLocaleDateString(),
        size: (file.size / 1024).toFixed(2) + ' KB'
      };
      setDocuments(prev => [...prev, newDoc]);
      setSelectedDoc(newDoc);
      setUsageStats(prev => ({ ...prev, uploads: prev.uploads + 1 }));
      event.target.value = '';
      setActiveTab('documents');
    } catch (error) {
      console.error('File processing error:', error);
    } finally {
      setLoading(false);
    }
  };

  const askQuestion = async () => {
    if (!selectedDoc || !question.trim()) return;
    if (hasReachedLimit('questions')) {
      setShowActivationModal(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          context: selectedDoc.content,
          temperature: 0.3,
          max_tokens: 800,
          model: "google/gemma-3n-e2b-it:free"
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
      setAnswer(data.reply || 'No response received');
      setUsageStats(prev => ({ ...prev, questions: prev.questions + 1 }));
    } catch (err) {
      console.error('AI API error:', err);
      if (err.message.includes('moderation')) {
        setError('Your question was flagged. Try rephrasing it more generally.');
      } else {
        setError('Failed to get AI response. Please ensure the backend server is running.');
      }
      setAnswer('');
    }
    setLoading(false);
  };

  const generateQuiz = async (doc, customConfig = null) => {
    if (hasReachedLimit('quizzes')) {
      setShowActivationModal(true);
      setShowQuizConfig(false);
      return;
    }
    const config = customConfig || quizConfig;
    setLoading(true);
    setError(null);
    try {
      const questionTypeText = config.questionTypes.join(' and ');
      const prompt = `Based on the following document content, generate ${config.questionCount} quiz questions at ${config.difficulty} difficulty level. Include ${questionTypeText} questions. Format your response as a JSON array with this structure: [{"question": "question text", "type": "multiple-choice", "options": ["option1", "option2", "option3", "option4"], "correct": 0, "difficulty": "${config.difficulty}"}] Document content: ${doc.content.substring(0, 3000)}`;
      const response = await fetch(`${API_BASE_URL}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: prompt, 
          context: '', 
          temperature: 0.7, 
          max_tokens: 2000,
          model: "google/gemma-3n-e2b-it:free"
        })
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      let questions = [];
      try {
        const jsonMatch = data.reply.match(/\[[\s\S]*\]/);
        if (jsonMatch) questions = JSON.parse(jsonMatch[0]);
      } catch (parseErr) {
        console.error('Failed to parse quiz JSON:', parseErr);
        questions = getFallbackQuestions(config);
      }
      const validQuestions = questions.filter(q => q.question && q.type).slice(0, config.questionCount).map((q, index) => ({ ...q, id: index + 1 }));
      if (validQuestions.length === 0) throw new Error('No valid questions generated');
      const generatedQuiz = { title: `Quiz: ${doc.name}`, config: config, questions: validQuestions };
      setQuiz(generatedQuiz);
      setQuizAnswers({});
      setQuizResults(null);
      setShowQuizConfig(false);
      setActiveTab('quiz');
      setUsageStats(prev => ({ ...prev, quizzes: prev.quizzes + 1 }));
    } catch (err) {
      console.error('Quiz generation error:', err);
      setError('Failed to generate quiz. Please try again.');
    }
    setLoading(false);
  };

  const getFallbackQuestions = (config) => {
    const fallbackPool = [
      { question: "What are the main topics discussed in the document?", type: "multiple-choice", options: ["Technical concepts and methodologies", "Unrelated random topics", "Historical events only", "Entertainment reviews"], correct: 0, difficulty: config.difficulty },
      { question: "The document contains informational content.", type: "true-false", correct: true, difficulty: config.difficulty }
    ];
    return fallbackPool.filter(q => config.questionTypes.includes(q.type)).slice(0, config.questionCount);
  };

  const handleQuizAnswer = (questionId, answer) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const submitQuiz = () => {
    if (!quiz) return;
    let correct = 0;
    quiz.questions.forEach(q => {
      if (quizAnswers[q.id] === q.correct) correct++;
    });
    setQuizResults({ correct, total: quiz.questions.length, percentage: Math.round((correct / quiz.questions.length) * 100) });
  };

  const deleteDocument = (docId) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId));
    if (selectedDoc && selectedDoc.id === docId) setSelectedDoc(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {error && (
        <div className="fixed top-4 right-4 left-4 md:left-auto md:w-96 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
              <p className="text-xs text-red-600 mt-1">If this persists, please try again.</p>
            </div>
            <button onClick={() => setError(null)} className="ml-3 text-red-400 hover:text-red-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {showActivationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <Lock className="h-12 w-12 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Upgrade to Premium</h3>
              <p className="text-sm text-gray-600 text-center mb-4">You've reached the free tier limit. Enter an activation code to unlock unlimited access.</p>
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
              <input type="text" value={activationCode} onChange={(e) => setActivationCode(e.target.value)} placeholder="Enter activation code" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4" />
              <div className="flex flex-col space-y-2">
                <button onClick={handleActivation} className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Activate Premium</button>
                <button onClick={() => setShowContactModal(true)} className="w-full px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100">Get Activation Code</button>
                <button onClick={() => setShowActivationModal(false)} className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Maybe Later</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Us for Premium Access</h3>
              <p className="text-sm text-gray-600 mb-6">Get your activation code and unlock unlimited access to StudyAI Premium.</p>
              <div className="space-y-4">
                <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <MessageSquare className="h-6 w-6 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">WhatsApp</p>
                    <p className="text-xs text-gray-600">Chat with us instantly</p>
                  </div>
                </a>
                <a href="mailto:support@studyai.com" className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <Mail className="h-6 w-6 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <p className="text-xs text-gray-600">support@studyai.com</p>
                  </div>
                </a>
                <a href="tel:+1234567890" className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <Phone className="h-6 w-6 text-purple-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Phone</p>
                    <p className="text-xs text-gray-600">+1 (234) 567-890</p>
                  </div>
                </a>
              </div>
              <button onClick={() => { setShowContactModal(false); setShowActivationModal(false); }} className="w-full mt-6 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Close</button>
            </div>
          </div>
        </div>
      )}

      {showQuizConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configure Your Quiz</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Questions</label>
                  <select value={quizConfig.questionCount} onChange={(e) => setQuizConfig(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
                  <select value={quizConfig.difficulty} onChange={(e) => setQuizConfig(prev => ({ ...prev, difficulty: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => setShowQuizConfig(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button onClick={() => generateQuiz(selectedDocForQuiz)} disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Generate Quiz</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">StudyAI</h1>
              {isActivated && (<span className="ml-2 px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">PREMIUM</span>)}
            </div>
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
                <button onClick={clearAllData} className="text-gray-400 hover:text-red-500" title="Clear all data">
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            )}
            <nav className="hidden md:flex space-x-8">
              <button onClick={() => setActiveTab('upload')} className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'upload' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}><Upload className="h-4 w-4 inline mr-2" />Upload</button>
              <button onClick={() => setActiveTab('documents')} className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'documents' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}><FileText className="h-4 w-4 inline mr-2" />Documents</button>
              <button onClick={() => setActiveTab('qa')} className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'qa' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}><MessageCircle className="h-4 w-4 inline mr-2" />Q&A</button>
              <button onClick={() => setActiveTab('quiz')} className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'quiz' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}><Play className="h-4 w-4 inline mr-2" />Quiz</button>
              <button onClick={() => setActiveTab('pricing')} className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'pricing' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}><Crown className="h-4 w-4 inline mr-2" />Upgrade</button>
            </nav>
            <div className="md:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                {mobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden pb-3">
              {!isActivated && (
                <div className="px-2 py-2 mb-2 bg-gray-50 rounded-md text-xs text-gray-600">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium mb-1">Usage:</div>
                      <div>{usageStats.uploads}/{FREE_LIMITS.uploads} uploads • {usageStats.questions}/{FREE_LIMITS.questions} Q&A • {usageStats.quizzes}/{FREE_LIMITS.quizzes} quizzes</div>
                    </div>
                    <button onClick={clearAllData} className="text-gray-400 hover:text-red-500 ml-2" title="Clear all data">
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
              <button onClick={() => { setActiveTab('upload'); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'upload' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}><Upload className="h-4 w-4 inline mr-2" />Upload</button>
              <button onClick={() => { setActiveTab('documents'); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'documents' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}><FileText className="h-4 w-4 inline mr-2" />Documents</button>
              <button onClick={() => { setActiveTab('qa'); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'qa' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}><MessageCircle className="h-4 w-4 inline mr-2" />Q&A</button>
              <button onClick={() => { setActiveTab('quiz'); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'quiz' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}><Play className="h-4 w-4 inline mr-2" />Quiz</button>
              <button onClick={() => { setActiveTab('pricing'); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'pricing' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}><Crown className="h-4 w-4 inline mr-2" />Upgrade</button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="text-center">
                <Upload className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Study Materials</h2>
                <p className="text-gray-600 mb-8">Upload PDF documents to get started with AI-powered study assistance</p>
                <label className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-indigo-500 transition-colors">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">PDF files only (Max 10MB)</p>
                  </div>
                  <input type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" disabled={loading} />
                </label>
                {loading && (
                  <div className="mt-6 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="ml-3 text-gray-600">Processing your PDF...</span>
                  </div>
                )}
                {!isActivated && (
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">Free tier: {FREE_LIMITS.uploads - usageStats.uploads} uploads remaining</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Documents</h2>
              <span className="text-sm text-gray-500">{documents.length} documents</span>
            </div>
            {documents.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600 mb-4">No documents uploaded yet</p>
                <button onClick={() => setActiveTab('upload')} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="h-5 w-5 mr-2" />Upload your first document
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.map((doc) => (
                  <div key={doc.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center flex-1">
                        <FileText className="h-8 w-8 text-red-500 mr-3 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900 truncate">{doc.name}</h3>
                          <p className="text-sm text-gray-500">{doc.uploadDate}</p>
                        </div>
                      </div>
                      <button onClick={() => deleteDocument(doc.id)} className="text-gray-400 hover:text-red-500 ml-2">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <button onClick={() => { setSelectedDocForQuiz(doc); setShowQuizConfig(true); }} disabled={loading} className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                        <Zap className="h-4 w-4 mr-2" />Generate Quiz
                      </button>
                      <button onClick={() => { setSelectedDoc(doc); setActiveTab('qa'); }} className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                        <MessageCircle className="h-4 w-4 mr-2" />Ask Questions
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'qa' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Ask Questions About Your Documents</h2>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Document</label>
              <select value={selectedDoc?.id || ''} onChange={(e) => { const doc = documents.find(d => d.id === e.target.value); setSelectedDoc(doc); }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Choose a document...</option>
                {documents.map((doc) => (<option key={doc.id} value={doc.id}>{doc.name}</option>))}
              </select>
            </div>
            {selectedDoc && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Question</label>
                  <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask anything about your document..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" rows="3" />
                  <button onClick={askQuestion} disabled={loading || !question.trim()} className="mt-4 w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                    {loading ? (<><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>Thinking...</>) : (<><Brain className="h-5 w-5 mr-2" />Ask AI</>)}
                  </button>
                  {!isActivated && (<p className="mt-2 text-sm text-gray-500">{FREE_LIMITS.questions - usageStats.questions} questions remaining</p>)}
                </div>
                {answer && (
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-gray-900">AI Answer:</h3>
                      <button onClick={() => copyToClipboard(answer)} className="flex items-center text-sm text-gray-600 hover:text-indigo-600">
                        <Copy className="h-4 w-4 mr-1" />Copy
                      </button>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-indigo-100">
                      <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: formatAIResponse(answer) }} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="max-w-4xl mx-auto">
            {!quiz ? (
              <div className="text-center bg-white rounded-lg shadow-md p-12">
                <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Generate a Quiz</h2>
                <p className="text-gray-600 mb-6">Select a document from your library to generate an interactive quiz</p>
                <button onClick={() => setActiveTab('documents')} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">View Documents</button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{quiz.title}</h2>
                    <p className="text-sm text-gray-500 mt-1">{quiz.questions.length} questions • {quiz.config.difficulty} difficulty</p>
                  </div>
                  {quizResults && (
                    <div className="text-right">
                      <div className="text-3xl font-bold text-indigo-600">{quizResults.percentage}%</div>
                      <div className="text-sm text-gray-500">{quizResults.correct} of {quizResults.total} correct</div>
                    </div>
                  )}
                </div>
                <div className="space-y-6">
                  {quiz.questions.map((q, index) => (
                    <div key={q.id} className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">{index + 1}. {q.question}</h3>
                      {q.type === 'multiple-choice' && (
                        <div className="space-y-3">
                          {q.options.map((option, optionIndex) => (
                            <label key={optionIndex} className="flex items-start space-x-3 cursor-pointer">
                              <input type="radio" name={`question-${q.id}`} value={optionIndex} checked={quizAnswers[q.id] === optionIndex} onChange={() => handleQuizAnswer(q.id, optionIndex)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 mt-1" disabled={quizResults} />
                              <span className={`flex-1 ${quizResults && optionIndex === q.correct ? 'text-green-600 font-medium' : quizResults && quizAnswers[q.id] === optionIndex && optionIndex !== q.correct ? 'text-red-600' : 'text-gray-700'}`}>
                                {option}
                                {quizResults && optionIndex === q.correct && (<Check className="h-5 w-5 inline ml-2 text-green-600" />)}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                      {q.type === 'true-false' && (
                        <div className="space-y-3">
                          {[true, false].map((value, idx) => (
                            <label key={idx} className="flex items-center space-x-3 cursor-pointer">
                              <input type="radio" name={`question-${q.id}`} value={value.toString()} checked={quizAnswers[q.id] === value} onChange={() => handleQuizAnswer(q.id, value)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300" disabled={quizResults} />
                              <span className={`${quizResults && value === q.correct ? 'text-green-600 font-medium' : quizResults && quizAnswers[q.id] === value && value !== q.correct ? 'text-red-600' : 'text-gray-700'}`}>
                                {value ? 'True' : 'False'}
                                {quizResults && value === q.correct && (<Check className="h-5 w-5 inline ml-2 text-green-600" />)}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex justify-between">
                  <button onClick={() => { setQuiz(null); setActiveTab('documents'); }} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">Back to Documents</button>
                  {!quizResults ? (
                    <button onClick={submitQuiz} className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Submit Quiz</button>
                  ) : (
                    <button onClick={() => { setQuizAnswers({}); setQuizResults(null); }} className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700">Retake Quiz</button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Unlock Your Study Potential</h2>
              <p className="text-lg text-gray-600">Choose the plan that fits your learning journey</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-200">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">Free</h3>
                    <Shield className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="mb-6"><span className="text-4xl font-bold text-gray-900">₦0</span><span className="text-gray-500">/month</span></div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" /><span className="text-gray-700">{FREE_LIMITS.uploads} document uploads per month</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" /><span className="text-gray-700">{FREE_LIMITS.questions} AI-powered Q&A sessions</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" /><span className="text-gray-700">{FREE_LIMITS.quizzes} quiz generations</span></li>
                    <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Basic PDF text extraction</span></li>
                  </ul>
                  <button disabled className="w-full py-3 px-6 rounded-lg font-medium bg-gray-100 text-gray-500 cursor-not-allowed">Current Plan</button>
                </div>
              </div>
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-2xl overflow-hidden border-2 border-indigo-400 transform lg:scale-105">
                <div className="bg-yellow-400 text-center py-2"><span className="text-sm font-bold text-gray-900">⭐ MOST POPULAR</span></div>
                <div className="p-8 text-white">
                  <div className="flex items-center justify-between mb-6"><h3 className="text-2xl font-bold">Premium</h3><Crown className="h-8 w-8 text-yellow-300" /></div>
                  <div className="mb-6"><span className="text-4xl font-bold">₦2,000</span><span className="text-indigo-200">/month</span></div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start"><Sparkles className="h-5 w-5 text-yellow-300 mr-3 flex-shrink-0 mt-0.5" /><span><strong>Unlimited</strong> document uploads</span></li>
                    <li className="flex items-start"><Sparkles className="h-5 w-5 text-yellow-300 mr-3 flex-shrink-0 mt-0.5" /><span><strong>Unlimited</strong> AI Q&A sessions</span></li>
                    <li className="flex items-start"><Sparkles className="h-5 w-5 text-yellow-300 mr-3 flex-shrink-0 mt-0.5" /><span><strong>Unlimited</strong> quiz generations</span></li>
                    <li className="flex items-start"><Clock className="h-5 w-5 text-yellow-300 mr-3 flex-shrink-0 mt-0.5" /><span>Priority AI response times</span></li>
                    <li className="flex items-start"><Brain className="h-5 w-5 text-yellow-300 mr-3 flex-shrink-0 mt-0.5" /><span>Advanced question difficulty levels</span></li>
                    <li className="flex items-start"><Users className="h-5 w-5 text-yellow-300 mr-3 flex-shrink-0 mt-0.5" /><span>24/7 Premium support</span></li>
                  </ul>
                  <button onClick={() => setShowContactModal(true)} className="w-full py-3 px-6 rounded-lg font-medium bg-white text-indigo-600 hover:bg-gray-100 transition-colors">Get Premium Access</button>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-indigo-200">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Upgrade Your Learning?</h3>
                <p className="text-gray-600 mb-6">Contact us to get your activation code and unlock premium features instantly</p>
                <div className="flex flex-wrap justify-center gap-4">
                  <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"><MessageSquare className="h-5 w-5 mr-2" />WhatsApp Us</a>
                  <a href="mailto:support@studyai.com" className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"><Mail className="h-5 w-5 mr-2" />Email Us</a>
                  <a href="tel:+1234567890" className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"><Phone className="h-5 w-5 mr-2" />Call Us</a>
                </div>
              </div>
            </div>
            <div className="mt-12">
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Frequently Asked Questions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6 shadow"><h4 className="font-semibold text-gray-900 mb-2">How do I activate Premium?</h4><p className="text-sm text-gray-600">Contact us through any method above to receive your activation code. Enter it in the app to unlock all features instantly.</p></div>
                <div className="bg-white rounded-lg p-6 shadow"><h4 className="font-semibold text-gray-900 mb-2">Can I try before upgrading?</h4><p className="text-sm text-gray-600">Yes! The free tier lets you test all features with limited usage. Upgrade anytime when you're ready for unlimited access.</p></div>
                <div className="bg-white rounded-lg p-6 shadow"><h4 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h4><p className="text-sm text-gray-600">We accept bank transfers, mobile money, and other local payment methods. Contact us for details specific to your region.</p></div>
                <div className="bg-white rounded-lg p-6 shadow"><h4 className="font-semibold text-gray-900 mb-2">Is my data secure?</h4><p className="text-sm text-gray-600">Absolutely! All your documents and data are stored securely and never shared with third parties.</p></div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudyAI;