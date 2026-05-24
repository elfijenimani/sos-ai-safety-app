import { useState } from "react";
import api from "../services/api";

const quickQuestions = [
  "Is my safety profile complete?",
  "What is my current risk level?",
  "Do I have enough emergency contacts?",
  "Is my Medical ID ready?",
  "What should I do before traveling alone?",
  "Do I have safe places saved?",
];

function SafetyAssistant() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const askAssistant = async (customQuestion) => {
    const finalQuestion = customQuestion || question;

    if (!finalQuestion.trim()) {
      setMessage("Please write or select a question.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await api.post("/api/assistant/ask", {
        question: finalQuestion,
      });

      setAnswer(response.data);
      setQuestion(finalQuestion);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Assistant could not answer right now."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">AI Safety Intelligence</p>
        <h1>Safety Assistant</h1>
        <p>
          Ask questions about your emergency readiness. The assistant analyzes
          contacts, Medical ID, SOS history, safe places and check-ins.
        </p>
      </div>

      {message && <div className="message-box">{message}</div>}

      <div className="assistant-layout">
        <div className="professional-card">
          <h2>Ask GuardianAI</h2>
          <p className="muted-text">
            Choose a quick question or write your own safety-related question.
          </p>

          <div className="quick-question-grid">
            {quickQuestions.map((item) => (
              <button
                key={item}
                className="quick-question-btn"
                onClick={() => askAssistant(item)}
                disabled={loading}
              >
                {item}
              </button>
            ))}
          </div>

          <label>Your question</label>
          <textarea
            placeholder="Example: What should I improve in my safety profile?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />

          <button
            className="primary-btn"
            onClick={() => askAssistant()}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Ask Assistant"}
          </button>
        </div>

        <div className="professional-card assistant-result-card">
          {!answer ? (
            <div className="empty-assistant">
              <span>🛡️</span>
              <h2>No analysis yet</h2>
              <p>
                Ask a question and GuardianAI will analyze your safety data from
                MongoDB.
              </p>
            </div>
          ) : (
            <>
              <div className="assistant-header">
                <p className="eyebrow">Assistant Answer</p>
                <h2>{answer.response.title}</h2>
                <p>{answer.response.answer}</p>
              </div>

              <div className="assistant-risk-box">
                <div>
                  <span>Risk Level</span>
                  <strong>{answer.profile.riskLevel}</strong>
                </div>

                <div>
                  <span>Risk Score</span>
                  <strong>{answer.profile.riskScore}/100</strong>
                </div>
              </div>

              <div className="assistant-actions">
                <h3>Recommended Actions</h3>

                {answer.response.actionItems.map((item, index) => (
                  <div className="assistant-action-item" key={index}>
                    <span>{index + 1}</span>
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SafetyAssistant;