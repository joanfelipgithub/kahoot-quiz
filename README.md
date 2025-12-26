# 🎮 Kahoot-Style Quiz Application

A real-time, interactive quiz application inspired by Kahoot, designed for classroom use. Students connect to a local server and compete by answering multiple-choice questions.

## 📋 Features

- ✅ **Real-time multiplayer** - Multiple students can join simultaneously
- ✅ **Live leaderboard** - Rankings update after each question
- ✅ **Timed questions** - Each question has a configurable time limit
- ✅ **Kahoot-style scoring** - Faster answers get more points
- ✅ **Easy question management** - Questions are defined in a simple TXT file
- ✅ **Vibrant UI** - Colorful, engaging interface with animations
- ✅ **Local network** - Works on LAN without internet connection
- ✅ **Teacher controls** - Start game from any connected device

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- A local network (Wi-Fi or LAN)

### Installation

1. **Extract the ZIP file** to a folder on your computer

2. **Open a terminal/command prompt** in the project folder

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

5. **Connect students:**
   - The server will display a URL like: `http://192.168.1.10:8080`
   - Students open this URL in their browsers (phones, tablets, computers)
   - They enter their names and join the lobby

6. **Start the quiz:**
   - Click the "Start Game" button (any connected device can do this)
   - The quiz begins automatically!

## 📝 Creating Questions

Questions are stored in `/questions/quiz.txt`

### Format

```
QuestionNumber(TimeInSeconds) Question text?
a. Option A
b. Option B
c. Option C
*d. Correct Answer (marked with *)
```

### Example

```
01(15s) What is the capital of Spain?
a. Barcelona
b. Valencia
c. Seville
*d. Madrid

02(20s) Which planet is closest to the Sun?
*a. Mercury
b. Venus
c. Earth
d. Mars
```

### Rules

- Each question starts with a number and time: `01(15s)`
- Time is in seconds (e.g., `15s`, `20s`, `30s`)
- Answers are labeled `a.`, `b.`, `c.`, `d.`
- Mark the correct answer with an asterisk `*` before the letter
- Leave a blank line between questions

## 🎯 How to Play

### For Students:

1. **Join** - Enter your name and click "Join Now"
2. **Wait** - See other players joining in the lobby
3. **Answer** - Click one of the four colored buttons (A/B/C/D)
4. **Compete** - Faster correct answers earn more points!
5. **Win** - Top scorer gets the trophy 🏆

### For Teachers:

1. **Prepare** - Edit `questions/quiz.txt` with your questions
2. **Start** - Run `npm start` on your computer
3. **Share** - Tell students the URL displayed in the terminal
4. **Launch** - Click "Start Game" when everyone is ready
5. **Monitor** - Watch the live leaderboard after each question

## 🎨 Customization

### Change Colors

Edit `public/style.css` and modify the CSS variables:

```css
:root {
    --color-bg: #1a0b2e;
    --color-primary: #ff6b9d;
    --color-secondary: #4cc9f0;
    --color-accent: #ffd23f;
}
```

### Change Timing

Edit `server.js`:

```javascript
const RANKING_DISPLAY_TIME = 5000; // 5 seconds (change this)
```

### Change Port

Edit `server.js`:

```javascript
const PORT = 8080; // Change to any available port
```

## 🛠️ Technical Details

### Architecture

- **Backend:** Node.js + Express + Socket.IO
- **Frontend:** HTML5 + CSS3 + Vanilla JavaScript
- **Real-time:** WebSocket connections via Socket.IO
- **State Management:** Server-authoritative game state

### File Structure

```
kahoot-quiz/
├── server.js              # Main server file
├── package.json           # Node.js dependencies
├── questions/
│   └── quiz.txt          # Question database
├── public/
│   ├── index.html        # Main HTML page
│   ├── style.css         # Styling
│   └── client.js         # Client-side logic
└── README.md             # This file
```

## 🎓 Educational Use

### Learning Objectives

Students will learn:
- **Client-Server Architecture** - How web apps communicate
- **Real-time Communication** - WebSocket technology
- **Event-Driven Programming** - Handling user interactions
- **State Management** - Keeping data synchronized
- **Frontend Development** - HTML/CSS/JavaScript
- **Backend Development** - Node.js and Express

### Suggested Exercises

1. **Beginner:** Add a "skip question" button
2. **Intermediate:** Implement different question types (true/false, multiple answers)
3. **Advanced:** Add user authentication and save scores to a database
4. **Expert:** Create an admin panel to manage questions without editing the TXT file

## 🐛 Troubleshooting

### "Cannot find module" error
```bash
npm install
```

### Server won't start
- Check if port 8080 is already in use
- Try changing the port in `server.js`

### Students can't connect
- Make sure all devices are on the same Wi-Fi network
- Check firewall settings (allow port 8080)
- Verify the server IP address is correct

### Questions not loading
- Check `questions/quiz.txt` formatting
- Ensure there's a blank line between questions
- Verify the asterisk `*` is on the correct answer

## 📱 Device Compatibility

- ✅ Desktop browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers (iOS Safari, Chrome, Firefox)
- ✅ Tablets
- ✅ Works offline on local network

## 📚 Further Development Ideas

- Add categories/topics for questions
- Implement a question editor interface
- Save game history and statistics
- Add sound effects and music
- Create team mode (groups instead of individuals)
- Add image-based questions
- Implement power-ups and bonuses
- Create a global leaderboard across multiple games

## 📄 License

MIT License - Free to use and modify for educational purposes

## 🤝 Contributing

Students and teachers are welcome to:
- Report bugs
- Suggest features
- Submit improvements
- Share question sets

## 💡 Tips for Teachers

1. **Test first** - Run a practice game before class
2. **Prepare backups** - Have multiple question sets ready
3. **Clear rules** - Explain scoring before starting
4. **Encourage participation** - Make it fun, not just competitive
5. **Review answers** - Use the results to identify learning gaps
6. **Mix difficulties** - Start easy, increase challenge gradually

## 🎉 Credits

Inspired by Kahoot! - A learning platform that makes education fun and engaging.

Built for educational purposes to teach web development concepts.

---

**Enjoy your quiz! 🚀**

For questions or issues, check the troubleshooting section or review the code comments.
