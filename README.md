# IntelliLearn: AI-Powered Classroom Assistant

![IntelliLearn Banner](https://github.com/user-attachments/assets/da4e5766-fdce-4a5b-a808-65c5af7c64cd)

## Index
<table>
  <thead>
    <tr>
      <th>S.No.</th>
      <th>Section</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td><a href="#1-introduction">Introduction</a></td>
    </tr>
    <tr>
      <td>2</td>
      <td><a href="#2-overview">Overview</a></td>
    </tr>
    <tr>
      <td>3</td>
      <td><a href="#3-features">Features</a></td>
    </tr>
    <tr>
      <td>4</td>
      <td><a href="#4-demo-video">Demo Video</a></td>
    </tr>
    <tr>
      <td>5</td>
      <td><a href="#5-project-structure">Project Structure</a></td>
    </tr>
    <tr>
      <td>6</td>
      <td><a href="#6-tech-stack">Tech Stack</a></td>
    </tr>
    <tr>
      <td>7</td>
      <td><a href="#7-how-to-run">How to Run</a></td>
    </tr>
    <tr>
      <td>8</td>
      <td><a href="#8-contributors">Contributors</a></td>
    </tr>
    <tr>
      <td>9</td>
      <td><a href="#9-license">License</a></td>
    </tr>
  </tbody>
</table>

## 1. Introduction

IntelliLearn is an innovative AI-powered assistant developed under the Intel® Unnati Program. Designed to transform classroom learning, it offers personalized, efficient, and stress-free academic support for students and educators.

## 2. Overview

IntelliLearn enhances the learning experience by leveraging advanced AI to deliver tailored study recommendations, streamlined workflows, and tools to reduce academic stress. It empowers users with adaptive, interactive, and accessible learning solutions.

## 3. Features

* **Intelligent and Adaptive Learning**: Delivers personalized responses, adjusting explanation complexity and pace based on user comprehension.
* **Multi-Modal Input Support**: Supports text, voice, and image inputs for natural and accessible interactions.
* **Visual and Diagram-Based Explanations**: Generates custom diagrams, concept maps, and interactive visuals to simplify complex topics.
* **Automated Notes Generation**: Creates structured notes and concise summaries during sessions to aid revision.
* **Interactive Quiz Assessments**: Offers adaptive quizzes that adjust difficulty based on performance and track progress.
* **Personalized Learning Paths**: Builds tailored study plans based on individual progress and preferences.
* **Intuitive Interface**: Features a user-friendly, chatbot-style UI accessible across devices and suitable for all age groups.

## 4. Demo Video

> *Demo coming soon...*

## 5. Project Structure

```
backend/
├── src/
│   ├── client.py
│   ├── speech_to_text.py
│   ├── supabaseClient.py
│   └── tools.py
├── Dockerfile
├── pyproject.toml
├── server.py

frontend/
├── public/
│   └── intellilearn.png
├── src/
│   ├── components/
│   │   ├── ui/
│   │   └── (other shared components)
│   ├── contexts/
│   ├── hooks/
│   ├── libs/
│   ├── pages/
│   ├── App.jsx
│   └── main.jsx
├── Dockerfile
├── package.json

docker-compose.yml
README.md
```

## 6. Tech Stack

### Backend

* **Python 3.13+**: Core programming language
* **uv**: Fast Python package manager
* **FastAPI**: High-performance web framework for APIs
* **LangChain**: Framework for LLM-powered applications
* **Google Generative AI**: AI model integration
* **OpenVINO**: Optimized AI inference for speech processing

### Frontend

* **React 19**: JavaScript library for dynamic UI
* **Vite**: Fast build tool and development server
* **Tailwind CSS**: Utility-first CSS framework
* **Framer Motion**: Animation library for smooth interactions

### Database & Cloud

* **Supabase**: Backend-as-a-Service for database and authentication
* **PostgreSQL**: Robust relational database

### Deployment

* **Docker**: Containerization for consistent environments
* **Docker Compose**: Multi-container orchestration

## 7. How to Run?

### Prerequisites

* **Docker**, **Docker Compose**, and **Docker Desktop** installed
* **Git** for cloning the repository
* API keys for Google Generative AI, Supabase, and Hugging Face

### Installation Steps

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
   cd IntelliLearn
   ```

2. **Set Up Environment Variables**

   **Backend:**

   ```bash
   cd backend
   cp .env.example .env
   ```

   Edit `.env` to include your Google Generative AI API key and other required variables.

   **Frontend:**

   ```bash
   cd ../frontend
   cp .env.example .env
   ```

   Edit `.env` to include your Supabase project URL and API key.

3. **Run the Application**

   ```bash
   cd ..
   docker-compose up --build
   ```

4. **Access the Application**

   * **Frontend**: [http://localhost:5173](http://localhost:5173)
   * **Backend**: [http://localhost:8000](http://localhost:8000)

## 8. Contributors

* **[Bingumalla Likith](https://github.com/binguliki)** – AI Developer & Project Lead
* **[Vydhika Talatam](https://github.com/vtalatam05)** – Web Developer
* **[Ibrahim Chikani](https://github.com/IbrahimDev00)** – Full Stack Developer

## 9. License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
