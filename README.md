## 🗣️ AnonyTalks
AnonyTalks is a web application that enables users to receive anonymous feedback from anyone through a unique shareable link. 

## Features
### 🔐  User Authentication
Sign up using your email and password. After registration, enter the verification code to access the app

Sign up with email/password

One-click login with Google

Email verification for secure access

### 🧑‍💻 Personalized Dashboard

View and manage all received feedback

Access messages and uploaded media (images/videos)

Clean and user-friendly UI

### 🔗 Unique Feedback Link

Auto-generated based on your username

Share your link publicly or privately

Anyone with your link can submit anonymous feedback

### 📩 Anonymous Submissions

No login required to submit feedback

Option to send message and media (image/video)

Feedback instantly appears in the owner's dashboard

## Preview
![image](https://github.com/user-attachments/assets/b5d2a6e0-0742-4abe-b5a3-5b474a59bf7b)
![image](https://github.com/user-attachments/assets/a2d5670f-c80f-4003-80e7-1a914749f9f6)
![image](https://github.com/user-attachments/assets/6a88f29c-72f8-4c32-802c-4a5494e5cfea)

## 🛠️ How It Works
### 1. User signs up or logs in via Google.

### 2. After verification, they are redirected to their dashboard.

### 3. A unique link is generated (e.g., https://anonytalks.bharatwebcrafts.com/u/Bharatesh).

### 4. User can share this link to receive anonymous feedback.

### 5. Anonymous users can send a message and upload media.

### 6.The feedback appears in the dashboard of the user who owns the link.

## 📦 Tech Stack
### Frontend: Next.js, TypeScript, Tailwind CSS, ShadCN UI
### Authentication and Verification : NextAuth and Resend
### Backend: Next.js API Routes
### Storage: AWS S3 (for media files)
### Database: MongoDB (Mongoose ODM)
### Deployment: AWS EC2

## Getting Started

1.Clone the repository
```bash
https://github.com/BharateshPoojary/feedback-app.git
 cd feedback-app
```

2.Install Dependencies 
```bash
 npm install
```
3. Set Environment Variables
   #### Create a .env.local file in the root of your directory and add the following keys:
```bash
# MongoDB URI
MONGODB_URI="mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER>.mongodb.net/<DATABASE_NAME>"

# Resend API Key (for sending emails)
RESEND_API_KEY="<YOUR_RESEND_API_KEY>"

# Google OAuth Credentials
GOOGLE_CLIENT_ID="<YOUR_GOOGLE_CLIENT_ID>"
GOOGLE_CLIENT_SECRET="<YOUR_GOOGLE_CLIENT_SECRET>"

# AWS S3 Credentials
S3_ACCESS_KEY="<YOUR_AWS_ACCESS_KEY>"
S3_SECRET_KEY="<YOUR_AWS_SECRET_KEY>"
S3_BUCKET_NAME="<YOUR_S3_BUCKET_NAME>"
S3_REGION="<YOUR_S3_REGION>"

# Auth.js Secret
AUTH_SECRET="<YOUR_AUTH_SECRET>"


```
4. Run The App
```bash
 npm run dev
```
### Visit: http://localhost:3000

## 📫 Contributing
### Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License
### This project is open-source under the MIT License.

