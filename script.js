// script.js
const NUM_QUESTIONS = 30; // The required number of questions per test

const elements = {
    subjectSelect: document.getElementById('subject-select'),
    startBtn: document.getElementById('start-btn'),
    submitBtn: document.getElementById('submit-btn'),
    restartBtn: document.getElementById('restart-btn'),
    subjectSelectionDiv: document.getElementById('subject-selection'),
    quizArea: document.getElementById('quiz-area'),
    resultArea: document.getElementById('result-area'),
    quizForm: document.getElementById('quiz-form'),
    scoreDisplay: document.getElementById('score-display'),
    quizSubjectTitle: document.getElementById('quiz-subject-title'),
    feedbackDetails: document.getElementById('feedback-details')
};

let allSubjectsData = [];
let currentQuizQuestions = [];

// --- Utility Functions ---

// Fisher-Yates (Knuth) Shuffle for true random selection
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}

// --- Main Application Logic ---

async function loadData() {
    try {
        // Fetch the questions from the JSON file
        const response = await fetch('questions.json');
        const data = await response.json();
        allSubjectsData = data.subjects;
        populateSubjectDropdown();
    } catch (error) {
        console.error("Error loading quiz data:", error);
        alert("Could not load quiz data. Check questions.json file.");
    }
}

function populateSubjectDropdown() {
    elements.subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
    allSubjectsData.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.id;
        option.textContent = subject.name;
        elements.subjectSelect.appendChild(option);
    });
}

function startTest() {
    const selectedId = elements.subjectSelect.value;
    if (!selectedId) {
        alert("Please select a subject to start the test.");
        return;
    }

    const subject = allSubjectsData.find(s => s.id == selectedId);
    if (!subject || subject.questions.length < NUM_QUESTIONS) {
        alert(`Not enough questions for ${subject.name}. Need ${NUM_QUESTIONS}.`);
        return;
    }

    // 1. Shuffle and select the first 30 questions
    const shuffledQuestions = shuffle([...subject.questions]);
    currentQuizQuestions = shuffledQuestions.slice(0, NUM_QUESTIONS);
    
    // 2. Render the questions
    renderQuestions(subject.name);

    // 3. Update visibility
    elements.subjectSelectionDiv.classList.add('hidden');
    elements.resultArea.classList.add('hidden');
    elements.quizArea.classList.remove('hidden');
}

function renderQuestions(subjectName) {
    elements.quizSubjectTitle.textContent = `Subject: ${subjectName}`;
    elements.quizForm.innerHTML = ''; // Clear previous questions

    currentQuizQuestions.forEach((q, index) => {
        const questionElement = document.createElement('div');
        questionElement.className = 'question-card';
        questionElement.innerHTML = `
            <p><strong>${index + 1}. ${q.q}</strong></p>
            <div class="options">
                ${shuffle([...q.options]).map(option => `
                    <label>
                        <input type="radio" name="q-${index}" value="${option}" required>
                        ${option}
                    </label>
                `).join('')}
            </div>
        `;
        elements.quizForm.appendChild(questionElement);
    });
}

function submitTest() {
    let score = 0;
    const feedback = [];
    const formData = new FormData(elements.quizForm);

    currentQuizQuestions.forEach((q, index) => {
        const userAnswer = formData.get(`q-${index}`);
        const isCorrect = (userAnswer === q.answer);
        
        if (isCorrect) {
            score++;
        }

        feedback.push({
            qText: q.q,
            userAnswer: userAnswer || 'Not Answered',
            correctAnswer: q.answer,
            isCorrect: isCorrect,
            qIndex: index
        });
    });

    displayResults(score, feedback);
}

function displayResults(score, feedback) {
    elements.scoreDisplay.textContent = `${score} / ${NUM_QUESTIONS} (${((score / NUM_QUESTIONS) * 100).toFixed(2)}%)`;
    
    // Display question feedback in the result area
    elements.feedbackDetails.innerHTML = '<h3>Question Review:</h3>';
    feedback.forEach(item => {
        const itemElement = document.createElement('p');
        itemElement.className = item.isCorrect ? 'correct' : 'incorrect';
        itemElement.innerHTML = `
            <strong>Q${item.qIndex + 1}:</strong> ${item.qText}<br>
            Your Answer: ${item.userAnswer} | 
            Correct Answer: ${item.correctAnswer}
        `;
        elements.feedbackDetails.appendChild(itemElement);
    });

    // Update visibility
    elements.quizArea.classList.add('hidden');
    elements.resultArea.classList.remove('hidden');
}

function restartTest() {
    currentQuizQuestions = [];
    elements.quizForm.innerHTML = '';
    elements.subjectSelect.value = '';

    elements.quizArea.classList.add('hidden');
    elements.resultArea.classList.add('hidden');
    elements.subjectSelectionDiv.classList.remove('hidden');
}

// --- Event Listeners ---
elements.startBtn.addEventListener('click', startTest);
elements.submitBtn.addEventListener('click', (e) => {
    e.preventDefault();
    submitTest();
});
elements.restartBtn.addEventListener('click', restartTest);

// Load data when the page loads
loadData();