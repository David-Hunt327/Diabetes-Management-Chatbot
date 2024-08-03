const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.post('/chat', (req, res) => {
  const userInput = req.body.message.toLowerCase().trim();
  const session = req.session;

  if (!session.state) {
    session.state = { step: 0, symptoms: [] };
  }

  let responseMessage = '';
  let suggestions = [];


  const greetings = ['hello', 'hi', 'hey'];
  const symptomsKeywords = ['symptom', 'cold', 'sugar', 'thirst', 'frequent urination', 'fatigue', 'blurred vision'];
  const diagnosisPhrases = ['do i have diabetes', 'am i diabetic', 'i think i am diabetic', 'check for diabetes', 'i think i have diabetes'];
  const managementKeywords = ['manage', 'control', 'diet', 'exercise', 'insulin', 'medication'];
  const commonSymptomsQueries = ['what are the symptoms', 'what are common symptoms'];

  if (greetings.some(keyword => userInput.includes(keyword))) {
    responseMessage = 'Hello! How can I assist you with managing your diabetes today?';
    suggestions = ['What are the symptoms?', 'How to manage diabetes?', 'Diet tips'];
  } 

  else if (commonSymptomsQueries.some(query => userInput.includes(query))) {
    responseMessage = 'Common symptoms of diabetes include increased thirst, frequent urination, fatigue, blurred vision, and slow healing of wounds. If you experience these symptoms, it’s best to consult a healthcare professional.';
    suggestions = ['How to manage diabetes?', 'Diet tips', 'Exercise tips'];
  }

  else if (diagnosisPhrases.some(phrase => userInput.includes(phrase))) {
    responseMessage = 'While I cannot provide a diagnosis, I can help you understand diabetes symptoms and offer advice on management. It is best to consult a healthcare professional for a proper diagnosis.';
    suggestions = ['What are the symptoms of diabetes?', 'How can I manage it?', 'What to do next?'];
  }

  else if (symptomsKeywords.some(keyword => userInput.includes(keyword))) {
    session.state.symptoms.push(userInput);
    responseMessage = `It seems like you're describing symptoms. Based on what you've mentioned (${session.state.symptoms.join(', ')}), I suggest monitoring your symptoms closely and consulting a healthcare professional. Would you like some tips on managing diabetes?`;
    session.state.step = 4;
    suggestions = ['Yes, please!', 'No, thank you.', 'What are common symptoms?'];
  } 

  else if (managementKeywords.some(keyword => userInput.includes(keyword))) {
    if (userInput.includes('diet')) {
      responseMessage = 'A healthy diet for diabetes includes plenty of vegetables, lean proteins, and whole grains while limiting sugar and refined carbs.';
      suggestions = ['More about diet', 'Exercise tips', 'Medication advice'];
    } else if (userInput.includes('exercise')) {
      responseMessage = 'Regular physical activity helps lower blood sugar levels and can improve your overall health. Aim for at least 150 minutes of moderate exercise per week.';
      suggestions = ['Diet tips', 'More about exercise', 'Insulin management'];
    } else if (userInput.includes('insulin')) {
      responseMessage = 'Managing insulin involves monitoring your blood sugar levels and adjusting your insulin intake as needed. Always follow your healthcare provider’s instructions.';
      suggestions = ['Diet tips', 'Exercise tips', 'Medication advice'];
    } else if (userInput.includes('medication')) {
      responseMessage = 'It’s important to take your medication as prescribed by your healthcare provider. Never skip doses, and discuss any concerns with your doctor.';
      suggestions = ['More about medication', 'Diet tips', 'Exercise tips'];
    } else {
      responseMessage = 'To manage diabetes, it is important to monitor your blood sugar, eat a balanced diet, exercise regularly, and follow your healthcare provider’s advice.';
      suggestions = ['Tell me more about diet', 'Exercise tips', 'Insulin management'];
    }
  } 

  else {
    switch (session.state.step) {
      case 0:
        responseMessage = 'Do you have any symptoms you would like to discuss?';
        suggestions = ['Yes', 'No', 'What are common symptoms?'];
        session.state.step++;
        break;
      case 1:
        if (userInput.includes('yes')) {
          responseMessage = 'Please list any symptoms you are experiencing.';
          suggestions = ['Fatigue', 'Frequent urination', 'Blurred vision'];
          session.state.step++;
        } else {
          responseMessage = 'Great! If you have any questions about managing diabetes, feel free to ask.';
          suggestions = ['How to manage diabetes?', 'What are common symptoms?', 'Diet tips'];
          session.state.step = 0; 
        }
        break;
      case 2:
        session.state.symptoms.push(userInput);
        responseMessage = `You mentioned experiencing ${userInput}. Are you experiencing any other symptoms?`;
        suggestions = ['Yes', 'No', 'Other symptoms'];
        session.state.step++;
        break;
      case 3:
        if (userInput.includes('no')) {
          responseMessage = `Based on the symptoms you've described (${session.state.symptoms.join(', ')}), I recommend monitoring your blood sugar levels and consulting with a healthcare professional. Would you like some tips on managing diabetes?`;
          suggestions = ['Yes, please!', 'No, thank you.', 'How to manage diabetes?'];
          session.state.step++;
        } else {
          session.state.symptoms.push(userInput);
          responseMessage = `Got it. Any more symptoms?`;
          suggestions = ['Fatigue', 'Frequent urination', 'Blurred vision'];
        }
        break;
      case 4:
        if (userInput.includes('yes')) {
          responseMessage = 'Here are some tips for managing diabetes: Monitor your blood sugar regularly, maintain a balanced diet, exercise regularly, and take medications as prescribed.';
          suggestions = ['Tell me more about diet', 'Exercise tips', 'Medication advice'];
        } else {
          responseMessage = 'Okay, feel free to reach out if you have any more questions!';
          suggestions = ['What are common symptoms?', 'How to manage diabetes?', 'Diet tips'];
        }
        session.state.step = 0;  
        break;
      default:
        responseMessage = 'Thank you for reaching out. How can I assist you with your diabetes management today?';
        suggestions = ['What are the symptoms?', 'How to manage diabetes?', 'Diet tips'];
        session.state.step = 0;  
        break;
    }
  }

  res.json({ reply: responseMessage, suggestions });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
