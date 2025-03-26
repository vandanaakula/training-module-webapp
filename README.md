<h1>Training Module Web Application</h1><br>
This project is a Training Module Web App designed to manage training modules, track user progress, and provide a seamless learning experience. Built with the MERN Stack (MongoDB, Express, React, Node.js), it includes authentication, progress tracking, and module management.
<h2>Folder Structure</h2>
<pre>
backend
├── controllers
├── middleware
├── models
│   ├── Module.js
│   ├── QuizResult.js
│   └── User.js
├── node_modules
├── routes
│   ├── authRoutes.js
│   ├── moduleRoutes.js
│   ├── progress.js
│   └── quizRoutes.js
├── uploads
├── .env
├── database.js
├── index.js
├── package-lock.json
├── package.json
└── VerifyToken.js
frontend
├── node_modules
├── public
└── src
    ├── components
    ├── pages
    ├── services
    ├── App.css
    ├── App.js
    ├── App.test.js
    ├── index.css
    ├── index.js
    ├── logo.svg
    ├── reportWebVitals.js
    └── setupTests.js
├── .gitignore
├── package-lock.json
└── package.json
</pre>
<h2>Tech stack</h2>
Frontend: React<br>
Backend: Node.js, Express, MongoDB<br>
API Testing: Postman<br>
<h2>Set up instructions</h2>
<h3>Backend Setup</h3>
1. go to /backend folder<br>
cd backend<br>
2. enter command<br>
nodemon index.js<br>
<h3>frontend Setup</h3>
1. go to /frontend folder<br>
cd frontend<br>
2. enter command<br>
npm start<br>
<h2>Features</h2>
User Authentication (Signup/Login)<br>
Module Management<br>
Progress Tracking<br>
REST API with Postman<br>
