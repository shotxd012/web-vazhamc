# VazhamC Web Application

A comprehensive web application built with Node.js, Express, and MongoDB, featuring Discord integration and various administrative features.

## 🚀 Features

- **Authentication System**
  - Discord OAuth2 integration
  - User session management
  - Profile management

- **Messaging System**
  - Real-time messaging
  - Message history
  - Media sharing capabilities

- **Administrative Features**
  - User management
  - Ticket system
  - Announcements
  - Staff management
  - Rules management
  - Activity tracking

- **Media Management**
  - Cloudinary integration for media storage
  - File upload capabilities
  - Media sharing

- **Discord Integration**
  - Discord bot functionality
  - Event handling
  - User synchronization

## 🛠️ Tech Stack

- **Backend**
  - Node.js
  - Express.js
  - MongoDB with Mongoose
  - Passport.js for authentication

- **Frontend**
  - EJS templating engine
  - Static file serving
  - Responsive design

- **Additional Services**
  - Cloudinary for media storage
  - Discord.js for bot integration
  - Express-session for session management

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Discord Bot Token
- Cloudinary Account
- Environment variables configured

## 🔧 Installation

1. Clone the repository:
   ```bash
   git clone [git@github.com:shotxd012/web-vazhamc.git]
   cd web-vazhamc
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   MONGODB_URI=your_mongodb_uri
   SESSION_SECRET=your_session_secret
   DISCORD_CLIENT_ID=your_discord_client_id
   DISCORD_CLIENT_SECRET=your_discord_client_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

4. Start the application:
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 📁 Project Structure

```
├── app.js              # Main application file
├── config/            # Configuration files
├── events/            # Discord event handlers
├── middleware/        # Custom middleware
├── models/           # Database models
├── public/           # Static files
├── routes/           # Route handlers
│   ├── admin/       # Admin routes
│   ├── auth/        # Authentication routes
│   └── ...
├── utils/            # Utility functions
└── views/            # EJS templates
```

## 🔄 Available Scripts

- `npm start` - Start the application in production mode
- `npm run dev` - Start the application in development mode with nodemon
- `npm run build` - Build the application (currently no build step required)

## 🔒 Security

- Session-based authentication
- Environment variable protection
- Secure password hashing with bcrypt
- Protected routes and middleware

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Discord.js team for the amazing Discord API wrapper
- Express.js team for the web framework
- MongoDB team for the database
