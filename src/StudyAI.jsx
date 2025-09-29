import React, { useState, useEffect } from 'react';
import { Upload, FileText, Brain, Zap, Crown, Star, MessageCircle, Play, Download, Trash2, Plus, Check, Menu, X } from 'lucide-react';

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
  const [currentPlan, setCurrentPlan] = useState('free');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showQuizConfig, setShowQuizConfig] = useState(false);
  const [selectedDocForQuiz, setSelectedDocForQuiz] = useState(null);
  const [quizConfig, setQuizConfig] = useState({
    questionCount: 5,
    difficulty: 'medium',
    questionTypes: ['multiple-choice', 'true-false']
  });

  // Load documents from localStorage on mount
  useEffect(() => {
    const savedDocs = localStorage.getItem('studyai-documents');
    if (savedDocs) {
      setDocuments(JSON.parse(savedDocs));
    }
  }, []);

  // Save documents to localStorage
  const saveDocuments = (docs) => {
    localStorage.setItem('studyai-documents', JSON.stringify(docs));
    setDocuments(docs);
  };

  // Simulate PDF text extraction
  const extractTextFromPDF = async (file) => {
    // In a real app, you'd use pdf-parse or PDF.js
    // For demo purposes, we'll simulate with a delay and dummy text
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return `Sample extracted text from ${file.name}. This would contain the actual PDF content in a real implementation. 
    
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 

Key concepts covered:
1. Document analysis fundamentals
2. Information extraction techniques  
3. Knowledge management systems
4. Educational technology applications

This text would be much longer in a real document and would contain the actual content that students want to study from.`;
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    setLoading(true);
    try {
      const extractedText = await extractTextFromPDF(file);
      const newDoc = {
        id: Date.now(),
        name: file.name,
        size: file.size,
        uploadDate: new Date().toLocaleDateString(),
        content: extractedText
      };
      
      const updatedDocs = [...documents, newDoc];
      saveDocuments(updatedDocs);
      alert('Document uploaded successfully!');
    } catch {
      alert('Error processing document');
    }
    setLoading(false);
    event.target.value = '';
  };

  // Simulate AI API call for Q&A
  const askQuestion = async () => {
    if (!selectedDoc || !question.trim()) return;
    
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate AI response based on document content
      const responses = [
        `Based on the document "${selectedDoc.name}", here's what I found: The main concepts discussed include document analysis and information extraction techniques. This relates to your question about "${question}".`,
        `According to the uploaded document, the key points relevant to your question are: The document covers educational technology applications and knowledge management systems.`,
        `From the document content, I can explain that: The material discusses fundamental approaches to document processing and analysis, which directly addresses your inquiry about "${question}".`
      ];
      
      setAnswer(responses[Math.floor(Math.random() * responses.length)]);
    } catch {
      setAnswer('Sorry, I encountered an error processing your question.');
    }
    setLoading(false);
  };

  // Generate quiz from document
  const generateQuiz = async (doc, customConfig = null) => {
    const config = customConfig || quizConfig;
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate questions based on user configuration
      const questionPool = [
        {
          question: "What are the main concepts covered in document analysis?",
          type: "multiple-choice",
          options: [
            "Information extraction and knowledge management",
            "Data visualization and reporting", 
            "Network security and encryption",
            "Mobile app development"
          ],
          correct: 0,
          difficulty: "easy"
        },
        {
          question: "Document analysis fundamentals include educational technology applications.",
          type: "true-false",
          correct: true,
          difficulty: "medium"
        },
        {
          question: "What is the primary purpose of knowledge management systems?",
          type: "multiple-choice",
          options: [
            "To store files randomly",
            "To organize and retrieve information effectively",
            "To create backup copies", 
            "To delete old documents"
          ],
          correct: 1,
          difficulty: "medium"
        },
        {
          question: "Information extraction techniques are mentioned as a key concept.",
          type: "true-false",
          correct: true,
          difficulty: "easy"
        },
        {
          question: "Which of the following best describes automated document processing?",
          type: "multiple-choice",
          options: [
            "Manual data entry by humans",
            "Using algorithms to extract and analyze content",
            "Printing documents on paper",
            "Deleting unnecessary files"
          ],
          correct: 1,
          difficulty: "hard"
        },
        {
          question: "Educational technology applications can enhance learning outcomes.",
          type: "true-false",
          correct: true,
          difficulty: "easy"
        },
        {
          question: "What role does artificial intelligence play in document analysis?",
          type: "multiple-choice",
          options: [
            "It replaces all human involvement",
            "It assists in pattern recognition and content extraction",
            "It only works with image files",
            "It makes documents more colorful"
          ],
          correct: 1,
          difficulty: "hard"
        },
        {
          question: "Knowledge management systems require regular maintenance and updates.",
          type: "true-false",
          correct: true,
          difficulty: "medium"
        }
      ];
      
      // Filter by difficulty and question types
      let filteredQuestions = questionPool.filter(q => {
        const matchesType = config.questionTypes.includes(q.type);
        const matchesDifficulty = config.difficulty === 'all' || q.difficulty === config.difficulty;
        return matchesType && matchesDifficulty;
      });
      
      // If not enough questions match criteria, expand the pool
      if (filteredQuestions.length < config.questionCount) {
        filteredQuestions = questionPool.filter(q => config.questionTypes.includes(q.type));
      }
      
      // Shuffle and select the requested number of questions
      const shuffled = filteredQuestions.sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, Math.min(config.questionCount, shuffled.length));
      
      const generatedQuiz = {
        title: `Quiz: ${doc.name}`,
        config: config,
        questions: selectedQuestions.map((q, index) => ({ ...q, id: index + 1 }))
      };
      
      setQuiz(generatedQuiz);
      setQuizAnswers({});
      setQuizResults(null);
      setShowQuizConfig(false);
      setActiveTab('quiz');
    } catch {
      alert('Error generating quiz');
    }
    setLoading(false);
  };

  // Handle quiz answer
  const handleQuizAnswer = (questionId, answer) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Submit quiz
  const submitQuiz = () => {
    if (!quiz) return;
    
    let correct = 0;
    quiz.questions.forEach(q => {
      if (quizAnswers[q.id] === q.correct) {
        correct++;
      }
    });
    
    setQuizResults({
      correct,
      total: quiz.questions.length,
      percentage: Math.round((correct / quiz.questions.length) * 100)
    });
  };

  // Delete document
  const deleteDocument = (docId) => {
    const updatedDocs = documents.filter(doc => doc.id !== docId);
    saveDocuments(updatedDocs);
    if (selectedDoc && selectedDoc.id === docId) {
      setSelectedDoc(null);
    }
  };

  const pricingPlans = [
    {
      name: 'Free',
      price: '$0',
      features: ['5 documents/month', 'Basic Q&A', '2 quizzes/month'],
      current: currentPlan === 'free'
    },
    {
      name: 'Student',
      price: '$9.99',
      features: ['50 documents/month', 'Advanced Q&A', 'Unlimited quizzes', 'Export results'],
      current: currentPlan === 'student'
    },
    {
      name: 'Pro',
      price: '$19.99',
      features: ['Unlimited documents', 'AI tutoring', 'Custom quizzes', 'Analytics dashboard'],
      current: currentPlan === 'pro'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"
         onClick={() => mobileMenuOpen && setMobileMenuOpen(false)}>
      
      {/* Quiz Configuration Modal */}
      {showQuizConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
             onClick={(e) => e.target === e.currentTarget && setShowQuizConfig(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Configure Your Quiz
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Questions
                  </label>
                  <select
                    value={quizConfig.questionCount}
                    onChange={(e) => setQuizConfig(prev => ({
                      ...prev,
                      questionCount: parseInt(e.target.value)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value={3}>3 Questions</option>
                    <option value={5}>5 Questions</option>
                    <option value={8}>8 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                    <option value={20}>20 Questions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={quizConfig.difficulty}
                    onChange={(e) => setQuizConfig(prev => ({
                      ...prev,
                      difficulty: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="all">Mixed Difficulty</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Types
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={quizConfig.questionTypes.includes('multiple-choice')}
                        onChange={(e) => {
                          const types = e.target.checked
                            ? [...quizConfig.questionTypes, 'multiple-choice']
                            : quizConfig.questionTypes.filter(t => t !== 'multiple-choice');
                          if (types.length > 0) {
                            setQuizConfig(prev => ({ ...prev, questionTypes: types }));
                          }
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Multiple Choice</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={quizConfig.questionTypes.includes('true-false')}
                        onChange={(e) => {
                          const types = e.target.checked
                            ? [...quizConfig.questionTypes, 'true-false']
                            : quizConfig.questionTypes.filter(t => t !== 'true-false');
                          if (types.length > 0) {
                            setQuizConfig(prev => ({ ...prev, questionTypes: types }));
                          }
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">True/False</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowQuizConfig(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => generateQuiz(selectedDocForQuiz)}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : null}
                  Generate Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">StudyAI</h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'upload' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Upload className="h-4 w-4 inline mr-2" />
                Upload
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'documents' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="h-4 w-4 inline mr-2" />
                Documents
              </button>
              <button
                onClick={() => setActiveTab('qa')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'qa' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MessageCircle className="h-4 w-4 inline mr-2" />
                Q&A
              </button>
              <button
                onClick={() => setActiveTab('quiz')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'quiz' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Play className="h-4 w-4 inline mr-2" />
                Quiz
              </button>
              <button
                onClick={() => setActiveTab('pricing')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'pricing' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Crown className="h-4 w-4 inline mr-2" />
                Pricing
              </button>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              >
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                <button
                  onClick={() => {
                    setActiveTab('upload');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                    activeTab === 'upload' 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Upload className="h-5 w-5 inline mr-3" />
                  Upload
                </button>
                <button
                  onClick={() => {
                    setActiveTab('documents');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                    activeTab === 'documents' 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="h-5 w-5 inline mr-3" />
                  Documents
                </button>
                <button
                  onClick={() => {
                    setActiveTab('qa');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                    activeTab === 'qa' 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <MessageCircle className="h-5 w-5 inline mr-3" />
                  Q&A
                </button>
                <button
                  onClick={() => {
                    setActiveTab('quiz');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                    activeTab === 'quiz' 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Play className="h-5 w-5 inline mr-3" />
                  Quiz
                </button>
                <button
                  onClick={() => {
                    setActiveTab('pricing');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                    activeTab === 'pricing' 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Crown className="h-5 w-5 inline mr-3" />
                  Pricing
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Upload Your Document</h2>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 sm:p-12 text-center hover:border-indigo-400 transition-colors">
                <Upload className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-base sm:text-lg text-gray-600 mb-4">Drag and drop your PDF file here, or click to browse</p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                >
                  Choose PDF File
                </label>
              </div>
              
              {loading && (
                <div className="mt-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Processing document...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-2 sm:space-y-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Your Documents</h2>
              <span className="text-sm text-gray-500">{documents.length} documents uploaded</span>
            </div>
            
            {documents.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center">
                <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-base sm:text-lg text-gray-600">No documents uploaded yet</p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Upload your first document
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {documents.map((doc) => (
                  <div key={doc.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center flex-1 min-w-0">
                        <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 mr-2 sm:mr-3 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base">{doc.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-500">Uploaded {doc.uploadDate}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <button
                        onClick={() => {
                          setSelectedDocForQuiz(doc);
                          setShowQuizConfig(true);
                        }}
                        disabled={loading}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                      >
                        <Zap className="h-4 w-4 mr-1" />
                        Quiz
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDoc(doc);
                          setActiveTab('qa');
                        }}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Q&A
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Q&A Tab */}
        {activeTab === 'qa' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Ask Questions About Your Documents</h2>
            
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Document</label>
              <select
                value={selectedDoc?.id || ''}
                onChange={(e) => {
                  const doc = documents.find(d => d.id === parseInt(e.target.value));
                  setSelectedDoc(doc);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Choose a document...</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>{doc.name}</option>
                ))}
              </select>
            </div>
            
            {selectedDoc && (
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Question</label>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask anything about your document..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows="3"
                  />
                  <button
                    onClick={askQuestion}
                    disabled={loading || !question.trim()}
                    className="mt-4 w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Brain className="h-4 w-4 mr-2" />
                    )}
                    Ask AI
                  </button>
                </div>
                
                {answer && (
                  <div className="border-t pt-6">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3">AI Answer:</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{answer}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quiz Tab */}
        {activeTab === 'quiz' && (
          <div className="max-w-4xl mx-auto">
            {!quiz ? (
              <div className="text-center bg-white rounded-lg shadow-md p-8 sm:p-12">
                <Play className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Generate a Quiz</h2>
                <p className="text-gray-600 mb-6 text-sm sm:text-base">Select a document from your library to generate an interactive quiz</p>
                <button
                  onClick={() => setActiveTab('documents')}
                  className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  View Documents
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-2 sm:space-y-0">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{quiz.title}</h2>
                    <div className="text-xs sm:text-sm text-gray-500 mt-1">
                      {quiz.questions.length} questions • {quiz.config.difficulty} difficulty
                    </div>
                  </div>
                  {quizResults && (
                    <div className="text-center sm:text-right">
                      <div className="text-xl sm:text-2xl font-bold text-indigo-600">
                        {quizResults.percentage}%
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">
                        {quizResults.correct} of {quizResults.total} correct
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4 sm:space-y-6">
                  {quiz.questions.map((q, index) => (
                    <div key={q.id} className="border border-gray-200 rounded-lg p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4 leading-relaxed">
                        {index + 1}. {q.question}
                      </h3>
                      
                      {q.type === 'multiple-choice' && (
                        <div className="space-y-2 sm:space-y-3">
                          {q.options.map((option, optionIndex) => (
                            <label key={optionIndex} className="flex items-start space-x-3 cursor-pointer">
                              <input
                                type="radio"
                                name={`question-${q.id}`}
                                value={optionIndex}
                                checked={quizAnswers[q.id] === optionIndex}
                                onChange={() => handleQuizAnswer(q.id, optionIndex)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 mt-1"
                                disabled={quizResults}
                              />
                              <span className={`text-sm sm:text-base leading-relaxed ${
                                quizResults && optionIndex === q.correct 
                                  ? 'text-green-600 font-medium' 
                                  : quizResults && quizAnswers[q.id] === optionIndex && optionIndex !== q.correct
                                  ? 'text-red-600' 
                                  : 'text-gray-700'
                              }`}>
                                {option}
                                {quizResults && optionIndex === q.correct && (
                                  <Check className="h-4 w-4 inline ml-2 text-green-600" />
                                )}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {q.type === 'true-false' && (
                        <div className="space-y-2 sm:space-y-3">
                          {['True', 'False'].map((option, optionIndex) => (
                            <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                              <input
                                type="radio"
                                name={`question-${q.id}`}
                                value={optionIndex === 0}
                                checked={quizAnswers[q.id] === (optionIndex === 0)}
                                onChange={() => handleQuizAnswer(q.id, optionIndex === 0)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                disabled={quizResults}
                              />
                              <span className={`text-sm sm:text-base ${
                                quizResults && (optionIndex === 0) === q.correct 
                                  ? 'text-green-600 font-medium' 
                                  : quizResults && quizAnswers[q.id] === (optionIndex === 0) && (optionIndex === 0) !== q.correct
                                  ? 'text-red-600' 
                                  : 'text-gray-700'
                              }`}>
                                {option}
                                {quizResults && (optionIndex === 0) === q.correct && (
                                  <Check className="h-4 w-4 inline ml-2 text-green-600" />
                                )}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={() => setQuiz(null)}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm sm:text-base"
                  >
                    Back to Documents
                  </button>
                  
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                    {!quizResults && (
                      <button
                        onClick={submitQuiz}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm sm:text-base"
                      >
                        Submit Quiz
                      </button>
                    )}
                    
                    {quizResults && (
                      <button
                        onClick={() => {
                          setQuizAnswers({});
                          setQuizResults(null);
                        }}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm sm:text-base"
                      >
                        Retake Quiz
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Choose Your Study Plan</h2>
              <p className="text-base sm:text-lg text-gray-600">Unlock the full power of AI-driven studying</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {pricingPlans.map((plan, index) => (
                <div
                  key={plan.name}
                  className={`bg-white rounded-lg shadow-md overflow-hidden ${
                    plan.current ? 'ring-2 ring-indigo-500' : ''
                  } ${index === 1 ? 'md:scale-105' : ''}`}
                >
                  {index === 1 && (
                    <div className="bg-indigo-600 text-white text-center py-2 text-sm font-medium">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="p-6 sm:p-8">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="flex items-baseline mb-6">
                      <span className="text-3xl sm:text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-500 ml-1">/month</span>
                    </div>
                    
                    <ul className="space-y-3 mb-6 sm:mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-700 text-sm sm:text-base">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <button
                      onClick={() => setCurrentPlan(plan.name.toLowerCase())}
                      className={`w-full py-3 px-6 rounded-md font-medium transition-colors text-sm sm:text-base ${
                        plan.current
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                      disabled={plan.current}
                    >
                      {plan.current ? 'Current Plan' : 'Choose Plan'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-8 sm:mt-12">
              <p className="text-gray-600 text-sm sm:text-base">
                All plans include 24/7 support and a 30-day money-back guarantee
              </p>
            </div>
          </div>
        )}

      </main>

      {/* Loading Overlay */}
      {loading && activeTab !== 'documents' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-4 mx-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            <span className="text-gray-700 text-sm sm:text-base">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyAI;