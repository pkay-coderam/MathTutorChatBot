const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const suggestionButtons = document.querySelectorAll('.pill');

const storageKey = 'math-tutor-chat';

const starterMessages = [
  {
    role: 'bot',
    content:
      'Hi! I\'m Algebra Ace 🧮✨ I can help with equations, factoring, quadratics, functions, exponents, and more. Try asking me to solve a problem or explain a topic.',
  },
];

let messages = loadMessages();

async function sendToChatbot(message) {
  // Build the request body in the exact shape required by the classroom proxy.
  const requestBody = {
    model: 'class-chat-model',
    messages: [{ role: 'user', content: message }],
  };

  try {
    // Step 1: send a standard POST request with fetch().
    const response = await fetch('https://vibe-proxy-gqv4.onrender.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer sk-vibe-summer-2026',
      },
      body: JSON.stringify(requestBody),
    });

    // Step 2: if the server did not respond successfully, throw an error.
    if (!response.ok) {
      throw new Error(`Proxy request failed with status ${response.status}`);
    }

    // Step 3: read the JSON response and pull the AI text from the standard path.
    const data = await response.json();
    const aiReply = data?.choices?.[0]?.message?.content || 'No reply was returned.';

    return aiReply;
  } catch (error) {
    // Step 4: keep the app friendly even if the proxy is unavailable.
    console.error('Proxy request failed:', error);
    return 'Oops! The proxy server is taking a pause. Please try again in a moment. 🌈';
  }
}

function loadMessages() {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : starterMessages;
  } catch (error) {
    console.warn('Could not load saved chat:', error);
    return starterMessages;
  }
}

function saveMessages() {
  localStorage.setItem(storageKey, JSON.stringify(messages));
}

function renderMessages() {
  chatMessages.innerHTML = '';
  messages.forEach((message) => {
    const bubble = document.createElement('div');
    bubble.className = `message ${message.role}`;

    const label = document.createElement('div');
    label.className = 'message-label';
    label.textContent = message.role === 'bot' ? '✨ Algebra Ace' : 'You';

    const text = document.createElement('div');
    text.className = 'message-text';
    text.textContent = message.content;

    bubble.appendChild(label);
    bubble.appendChild(text);
    chatMessages.appendChild(bubble);
  });
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addMessage(role, content) {
  messages.push({ role, content });
  saveMessages();
  renderMessages();
}

function parseLinearEquation(input) {
  const match = input.match(/([+-]?\d*)\s*x\s*([+-]\s*\d+)?\s*=\s*([+-]?\d+)/i);
  if (!match) return null;

  const coefficientText = match[1] || '1';
  const coefficient = coefficientText === '-' ? -1 : Number(coefficientText);
  const constantText = match[2] ? match[2].replace(/\s+/g, '') : '+0';
  const constantValue = Number(constantText);
  const answerValue = Number(match[3]);

  if (Number.isNaN(coefficient) || Number.isNaN(constantValue) || Number.isNaN(answerValue)) {
    return null;
  }

  const x = (answerValue - constantValue) / coefficient;
  return { coefficient, constantValue, answerValue, x };
}

function generateReply(input) {
  const cleaned = input.trim().toLowerCase();

  if (/^hi$|^hello$|^hey$/.test(cleaned)) {
    return 'Hi there! I’m ready to help you with algebra magic. What would you like to learn today?';
  }

  if (cleaned.includes('solve') || /\bx\b/.test(cleaned) || /\=/.test(cleaned)) {
    const linear = parseLinearEquation(cleaned);
    if (linear) {
      return `Let’s solve it step by step!\n\n${linear.coefficient}x + ${linear.constantValue} = ${linear.answerValue}\nSubtract ${linear.constantValue} from both sides:\n${linear.coefficient}x = ${linear.answerValue - linear.constantValue}\nDivide by ${linear.coefficient}:\nx = ${linear.x}\n\n🎉 Your answer is x = ${linear.x}`;
    }
  }

  if (cleaned.includes('factor') || cleaned.includes('factoring')) {
    return 'Factoring is like breaking a big number or expression into smaller friendly pieces. For example, x² + 5x + 6 factors to (x + 2)(x + 3). Want me to show you how to factor a specific expression?';
  }

  if (cleaned.includes('quadratic') || cleaned.includes('roots') || cleaned.includes('parabola')) {
    return 'Quadratics are super cool! A quadratic usually looks like ax² + bx + c. You can solve it by factoring, completing the square, or using the quadratic formula. If you want, I can walk through one with you step by step.';
  }

  if (cleaned.includes('function') || cleaned.includes('slope')) {
    return 'Functions are like little machines that take an input and give an output. Slope tells you how steep a line is. If a line goes up 2 and right 1, the slope is 2. I can help you graph or describe one.';
  }

  if (cleaned.includes('log') || cleaned.includes('exponent')) {
    return 'Exponents and logs are like math powers and their opposites. For example, 2³ = 8, and log₂(8) = 3. Want a quick practice question?';
  }

  if (cleaned.includes('system') || cleaned.includes('matrix')) {
    return 'Systems of equations are solved when two or more equations work together. A common trick is substitution or elimination. I can help you solve a mini system in a fun way.';
  }

  if (cleaned.includes('help') || cleaned.includes('teach me')) {
    return 'Absolutely! I can explain a topic, solve a problem, or give you a practice question. Just send me an equation, a topic name, or even a tricky homework problem.';
  }

  return 'I’m here to help! Try asking me to solve an equation, explain factoring, or teach quadratics. I can also make practice questions for you.';
}

async function handleSubmit(event) {
  event.preventDefault();
  const value = userInput.value.trim();
  if (!value) return;

  addMessage('user', value);
  userInput.value = '';

  const reply = await sendToChatbot(value);
  addMessage('bot', reply);
}

chatForm.addEventListener('submit', handleSubmit);

suggestionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    userInput.value = button.textContent;
    chatForm.requestSubmit();
  });
});

renderMessages();
