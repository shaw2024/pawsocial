# 🐾 PawSocial

A full-stack dog matching application where dogs find playmates, buddies, and maybe even a soulmate. Connect with local dog owners and set up safe, fun meetups.

🌐 **Live Demo:** [https://shaw2024.github.io/pawsocial](https://shaw2024.github.io/pawsocial)

![PawSocial Banner](https://img.shields.io/badge/Dog-Matching-8b7355?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.3.1-61dafb?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-In--Memory-47a248?style=for-the-badge&logo=mongodb)

## ✨ Features

- 🐕 **Create Dog Profiles** - Add your pup with photos, personality traits, and energy levels
- 📍 **Discover Nearby Dogs** - Browse dogs in your area looking for playmates
- 💬 **Smart Matching** - Swipe-style interface to like or pass on potential matches
- 🎉 **Community Stream** - View all dogs in the community with like and share features
- ❤️ **Match System** - When two dogs like each other, it's a match!
- 🎨 **Beautiful Design** - Cream and light brown theme with smooth animations

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shaw2024/pawsocial.git
   cd pawsocial
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Start the backend server**
   ```bash
   cd ../server
   node index.js
   ```
   The server will start on `http://localhost:4000`

5. **Start the React frontend** (in a new terminal)
   ```bash
   cd client
   npm start
   ```
   The app will open at `http://localhost:3000`

## 🛠️ Tech Stack

### Backend
- **Express.js** - Fast, minimalist web framework
- **MongoDB** - In-memory database for development
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI library
- **Axios** - HTTP client
- **CSS3** - Custom styling with cream/brown theme

## 📁 Project Structure

```
pawsocial/
├── client/                 # React frontend
│   ├── public/            # Static files
│   └── src/
│       ├── App.js         # Main React component
│       ├── App.css        # Application styles
│       └── api.js         # API configuration
├── server/                # Express backend
│   ├── models/           # Mongoose models
│   │   ├── User.js
│   │   ├── Dog.js
│   │   ├── Like.js
│   │   └── Match.js
│   ├── routes/           # API routes
│   │   ├── auth.js
│   │   ├── dogs.js
│   │   └── match.js
│   ├── middleware/       # Custom middleware
│   └── index.js          # Server entry point
└── README.md
```

## 🎯 API Endpoints

### Authentication
- `POST /auth/register` - Create new user account
- `POST /auth/login` - User login

### Dogs
- `POST /dogs/create` - Add a new dog profile
- `GET /dogs/mine` - Get current user's dogs
- `GET /dogs/all` - Get all dogs (community feed)
- `GET /dogs/discover/:dogId` - Get dogs for matching

### Matching
- `POST /match/action` - Like or pass on a dog
- `GET /match/matches/:dogId` - Get matches for a dog

## 🎨 Features in Detail

### Dog Profiles
Create detailed profiles with:
- Name, age, breed
- Gender and energy level
- Temperament tags
- Photo uploads
- Location (city, ZIP)
- Vaccination status

### Discovery
- Swipe-style interface
- View dog details before deciding
- Like or pass with smooth animations
- Match notifications

### Community Stream
- Browse all dogs in one feed
- Like dogs directly from the stream
- Share profiles with friends
- Filter by location and traits

### Match System
- Mutual likes create matches
- View all your dog's matches
- See matched dogs' profiles
- Connect with other owners

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Protected API routes
- CORS enabled
- Input validation

## 🚧 Development

### Environment Variables

Create a `.env` file in the `server/` directory:

```env
PORT=4000
JWT_SECRET=your_jwt_secret_here
MONGO_URL=mongodb://127.0.0.1:27017/pawsocial
```

For development, the app uses an in-memory MongoDB server that starts automatically.

### Development Mode

The app includes:
- Hot module reloading on frontend
- Automatic server restart with nodemon (if installed)
- Enhanced error logging
- API request/response logging

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👨‍💻 Author

**shaw2024**
- GitHub: [@shaw2024](https://github.com/shaw2024)

## 🙏 Acknowledgments

- React team for the amazing framework
- Express.js for the robust backend framework
- MongoDB team for the database
- All dog lovers who inspired this project! 🐕

---

Made with ❤️ for dogs and their humans
