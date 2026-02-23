import { authService } from '../services/authService.js';
import { roomService } from '../services/roomService.js';
// Track active users in rooms
const usersByRoom = new Map();
// Track current game data per room for late joiners
const activeGameData = new Map();
export function setupSocketEvents(io) {
    io.on('connection', (socket) => {
        console.log(`[Socket] User connected: ${socket.id}`);
        // --- AUTHENTICATION ---
        socket.on('authenticate', async (data, callback) => {
            const decoded = authService.verifyToken(data.token);
            if (!decoded) {
                if (typeof callback === 'function')
                    callback({ success: false });
                return;
            }
            const user = await authService.getUserById(decoded.userId);
            if (!user) {
                if (typeof callback === 'function')
                    callback({ success: false });
                return;
            }
            socket.userId = user.id;
            socket.user = user;
            socket.emit('authenticated', { userId: user.id, username: user.username });
            if (typeof callback === 'function')
                callback({ success: true });
        });
        // --- ROOM EVENTS ---
        // Join room
        socket.on('join-room', async (data, callback) => {
            if (!socket.userId || !socket.user) {
                callback({ success: false, error: 'Not authenticated' });
                return;
            }
            const room = await roomService.addUserToRoom(data.roomId, socket.user);
            if (!room) {
                callback({ success: false, error: 'Room full or not found' });
                return;
            }
            socket.roomId = data.roomId;
            socket.join(`room:${data.roomId}`);
            socket.join(`user:${socket.userId}`); // Personal room for targeted events
            // Track user in room
            if (!usersByRoom.has(data.roomId)) {
                usersByRoom.set(data.roomId, new Set());
            }
            usersByRoom.get(data.roomId).add(socket.userId);
            // Create join system message & notify ALL room members
            const systemMessage = await roomService.addMessageToRoom(data.roomId, 'system', 'System', `${socket.user.username} joined the room`, true);
            io.to(`room:${data.roomId}`).emit('user-joined', {
                user: socket.user,
                message: systemMessage,
                onlineUsers: room.participants,
                hostId: room.hostId,
            });
            // Send full current room state directly to the new joiner
            // This ensures they see the active game, messages, and participants
            const currentGame = activeGameData.get(data.roomId);
            socket.emit('room-state', {
                room,
                activeGame: room.activeGame,
                gameData: currentGame?.gameData ?? null,
                messages: room.messages?.slice(-50) ?? [],
            });
            callback({ success: true, room });
        });
        // Leave room
        socket.on('leave-room', async () => {
            if (!socket.userId || !socket.roomId)
                return;
            const room = await roomService.removeUserFromRoom(socket.roomId, socket.userId);
            usersByRoom.get(socket.roomId)?.delete(socket.userId);
            if (room && socket.user) {
                // Check if room is empty
                if (!room.participants || room.participants.length === 0) {
                    console.log(`[Socket] Room ${socket.roomId} is empty, deleting...`);
                    await roomService.deleteRoom(socket.roomId);
                    io.emit('room-deleted', { roomId: socket.roomId }); // Notify lobby
                }
                else {
                    const systemMessage = await roomService.addMessageToRoom(socket.roomId, 'system', 'System', `${socket.user.username} left the room`, true);
                    io.to(`room:${socket.roomId}`).emit('user-left', {
                        userId: socket.userId,
                        username: socket.user.username,
                        message: systemMessage,
                        onlineUsers: room.participants,
                    });
                }
            }
            socket.leave(`room:${socket.roomId}`);
            socket.roomId = undefined;
        });
        // --- CHAT EVENTS ---
        // Send message
        socket.on('send-message', async (data, callback) => {
            if (!socket.userId || !socket.roomId || !socket.user) {
                callback({ success: false });
                return;
            }
            const message = await roomService.addMessageToRoom(socket.roomId, socket.userId, socket.user.username, data.text);
            if (!message) {
                callback({ success: false });
                return;
            }
            io.to(`room:${socket.roomId}`).emit('new-message', message);
            callback({ success: true, message });
        });
        // --- WEBRTC SIGNALING ---
        // Offer (SDP)
        socket.on('webrtc-offer', (data) => {
            io.to(`user:${data.to}`).emit('webrtc-offer', {
                from: socket.userId,
                offer: data.offer,
            });
        });
        // Answer (SDP)
        socket.on('webrtc-answer', (data) => {
            io.to(`user:${data.to}`).emit('webrtc-answer', {
                from: socket.userId,
                answer: data.answer,
            });
        });
        // ICE Candidate
        socket.on('webrtc-ice-candidate', (data) => {
            io.to(`user:${data.to}`).emit('webrtc-ice-candidate', {
                from: socket.userId,
                candidate: data.candidate,
            });
        });
        // --- GAME EVENTS ---
        socket.on('start-game', async (data, callback) => {
            if (!socket.roomId) {
                callback({ success: false });
                return;
            }
            const room = await roomService.updateActiveGame(socket.roomId, data.gameType);
            if (!room) {
                callback({ success: false });
                return;
            }
            let gameData = {};
            // SYNC LOGIC: Generate game content on server and broadcast
            if (data.gameType === 'QUIZ') {
                const allQuestions = [
                    // 🎬 Pop Culture
                    { category: "Pop Culture", emoji: "🎬", question: "Which movie features the line 'I'll be back'?", options: ["RoboCop", "The Terminator", "Total Recall", "Predator"], correctIndex: 1 },
                    { category: "Pop Culture", emoji: "🎬", question: "Who played Iron Man in the Marvel Cinematic Universe?", options: ["Chris Evans", "Chris Hemsworth", "Robert Downey Jr.", "Mark Ruffalo"], correctIndex: 2 },
                    { category: "Pop Culture", emoji: "🎬", question: "Which band sang 'Bohemian Rhapsody'?", options: ["The Beatles", "Led Zeppelin", "Queen", "ABBA"], correctIndex: 2 },
                    { category: "Pop Culture", emoji: "🎬", question: "What is the highest-grossing animated film of all time?", options: ["The Lion King", "Frozen II", "The Incredibles", "The Lion King (2019)"], correctIndex: 3 },
                    { category: "Pop Culture", emoji: "🎬", question: "Which TV show features characters named Ross, Rachel, Monica, Chandler, Joey, and Phoebe?", options: ["How I Met Your Mother", "Seinfeld", "Friends", "The Office"], correctIndex: 2 },
                    { category: "Pop Culture", emoji: "🎬", question: "Who sang 'Shake It Off'?", options: ["Katy Perry", "Taylor Swift", "Ariana Grande", "Beyoncé"], correctIndex: 1 },
                    { category: "Pop Culture", emoji: "🎬", question: "What color is Thanos's skin in the MCU?", options: ["Blue", "Green", "Purple", "Red"], correctIndex: 2 },
                    { category: "Pop Culture", emoji: "🎬", question: "Which streaming platform produced 'Stranger Things'?", options: ["HBO", "Disney+", "Netflix", "Amazon Prime"], correctIndex: 2 },
                    { category: "Pop Culture", emoji: "🎬", question: "Who is SpongeBob's best friend?", options: ["Squidward", "Sandy", "Patrick", "Gary"], correctIndex: 2 },
                    { category: "Pop Culture", emoji: "🎬", question: "Which artist had a concert film called 'Eras Tour'?", options: ["Beyoncé", "Taylor Swift", "Billie Eilish", "Dua Lipa"], correctIndex: 1 },
                    // 🔬 Science
                    { category: "Science", emoji: "🔬", question: "What is the chemical symbol for Gold?", options: ["Go", "Ag", "Fe", "Au"], correctIndex: 3 },
                    { category: "Science", emoji: "🔬", question: "How many bones does an adult human body have?", options: ["206", "212", "196", "222"], correctIndex: 0 },
                    { category: "Science", emoji: "🔬", question: "What planet is closest to the Sun?", options: ["Venus", "Earth", "Mercury", "Mars"], correctIndex: 2 },
                    { category: "Science", emoji: "🔬", question: "What gas do plants absorb from the atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correctIndex: 2 },
                    { category: "Science", emoji: "🔬", question: "What is the speed of light (approx)?", options: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "100,000 km/s"], correctIndex: 0 },
                    { category: "Science", emoji: "🔬", question: "What organ produces insulin?", options: ["Liver", "Kidney", "Pancreas", "Gallbladder"], correctIndex: 2 },
                    { category: "Science", emoji: "🔬", question: "What is the most abundant gas in Earth's atmosphere?", options: ["Oxygen", "Carbon Dioxide", "Hydrogen", "Nitrogen"], correctIndex: 3 },
                    { category: "Science", emoji: "🔬", question: "What is the powerhouse of the cell?", options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi Apparatus"], correctIndex: 1 },
                    { category: "Science", emoji: "🔬", question: "How many planets are in our solar system?", options: ["7", "8", "9", "10"], correctIndex: 1 },
                    { category: "Science", emoji: "🔬", question: "What type of rock is formed from cooled lava?", options: ["Sedimentary", "Metamorphic", "Igneous", "Fossil"], correctIndex: 2 },
                    // 🌍 Geography
                    { category: "Geography", emoji: "🌍", question: "What is the capital of Australia?", options: ["Sydney", "Melbourne", "Perth", "Canberra"], correctIndex: 3 },
                    { category: "Geography", emoji: "🌍", question: "Which country has the most natural lakes?", options: ["USA", "Russia", "Brazil", "Canada"], correctIndex: 3 },
                    { category: "Geography", emoji: "🌍", question: "What is the longest river in the world?", options: ["Amazon", "Mississippi", "Nile", "Yangtze"], correctIndex: 2 },
                    { category: "Geography", emoji: "🌍", question: "Which country is both a continent and a country?", options: ["Greenland", "Antarctica", "Australia", "Iceland"], correctIndex: 2 },
                    { category: "Geography", emoji: "🌍", question: "Mount Everest is in which mountain range?", options: ["Andes", "Alps", "Rockies", "Himalayas"], correctIndex: 3 },
                    { category: "Geography", emoji: "🌍", question: "What is the smallest country in the world?", options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"], correctIndex: 1 },
                    { category: "Geography", emoji: "🌍", question: "Which sea is the saltiest?", options: ["Red Sea", "Caspian Sea", "Dead Sea", "Mediterranean Sea"], correctIndex: 2 },
                    { category: "Geography", emoji: "🌍", question: "The Amazon rainforest is primarily in which country?", options: ["Colombia", "Venezuela", "Peru", "Brazil"], correctIndex: 3 },
                    // 🏛️ History
                    { category: "History", emoji: "🏛️", question: "Who was the first man to walk on the moon?", options: ["Buzz Aldrin", "Yuri Gagarin", "Neil Armstrong", "John Glenn"], correctIndex: 2 },
                    { category: "History", emoji: "🏛️", question: "In what year did World War II end?", options: ["1943", "1944", "1946", "1945"], correctIndex: 3 },
                    { category: "History", emoji: "🏛️", question: "Who painted the Mona Lisa?", options: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Donatello"], correctIndex: 2 },
                    { category: "History", emoji: "🏛️", question: "The Great Wall of China was primarily built to defend against whom?", options: ["Romans", "Mongols", "Persians", "Vikings"], correctIndex: 1 },
                    { category: "History", emoji: "🏛️", question: "Which empire was the largest in history?", options: ["Roman Empire", "Ottoman Empire", "British Empire", "Mongol Empire"], correctIndex: 2 },
                    { category: "History", emoji: "🏛️", question: "Who was the first female Prime Minister of the UK?", options: ["Theresa May", "Margaret Thatcher", "Angela Merkel", "Liz Truss"], correctIndex: 1 },
                    { category: "History", emoji: "🏛️", question: "The Titanic sank in which year?", options: ["1910", "1912", "1914", "1916"], correctIndex: 1 },
                    // 💻 Tech
                    { category: "Tech", emoji: "💻", question: "Who co-founded Apple with Steve Jobs?", options: ["Bill Gates", "Steve Wozniak", "Jeff Bezos", "Elon Musk"], correctIndex: 1 },
                    { category: "Tech", emoji: "💻", question: "What does HTTP stand for?", options: ["HyperText Transfer Protocol", "High-Tech Transfer Program", "Hyper Transfer Text Process", "HyperText Transmission Port"], correctIndex: 0 },
                    { category: "Tech", emoji: "💻", question: "Which company developed the Android OS?", options: ["Apple", "Microsoft", "Samsung", "Google"], correctIndex: 3 },
                    { category: "Tech", emoji: "💻", question: "What programming language is known for its use in web front-end development?", options: ["Python", "Java", "JavaScript", "C++"], correctIndex: 2 },
                    { category: "Tech", emoji: "💻", question: "In binary, what is the value of '1010'?", options: ["8", "12", "10", "14"], correctIndex: 2 },
                    { category: "Tech", emoji: "💻", question: "What does 'AI' stand for?", options: ["Automated Internet", "Artificial Intelligence", "Advanced Interface", "Automated Integration"], correctIndex: 1 },
                    { category: "Tech", emoji: "💻", question: "Which company owns Instagram?", options: ["Google", "Twitter", "Snap", "Meta"], correctIndex: 3 },
                    // ⚽ Sports
                    { category: "Sports", emoji: "⚽", question: "How many players are on a standard soccer team on the field?", options: ["9", "10", "11", "12"], correctIndex: 2 },
                    { category: "Sports", emoji: "⚽", question: "In which sport would you perform a 'slam dunk'?", options: ["Football", "Baseball", "Tennis", "Basketball"], correctIndex: 3 },
                    { category: "Sports", emoji: "⚽", question: "Which country has won the most FIFA World Cups?", options: ["Germany", "Argentina", "Brazil", "Italy"], correctIndex: 2 },
                    { category: "Sports", emoji: "⚽", question: "The Olympics are held every how many years?", options: ["2", "4", "5", "8"], correctIndex: 1 },
                    { category: "Sports", emoji: "⚽", question: "What sport is played at Wimbledon?", options: ["Cricket", "Golf", "Tennis", "Badminton"], correctIndex: 2 },
                    { category: "Sports", emoji: "⚽", question: "Who holds the record for most Grand Slam tennis titles (men's)?", options: ["Roger Federer", "Rafael Nadal", "Novak Djokovic", "Pete Sampras"], correctIndex: 2 },
                ];
                gameData = allQuestions[Math.floor(Math.random() * allQuestions.length)];
            }
            else if (data.gameType === 'TRUTH_DARE') {
                const truths = [
                    "What's the most embarrassing thing you've done in public?",
                    "Have you ever lied to get out of trouble? What was the lie?",
                    "What's your biggest fear?",
                    "What's the most childish thing you still do?",
                    "Who is your secret crush? (No names needed, describe them!)",
                    "What's the worst gift you've ever received?",
                    "Have you ever pretended to be sick to avoid something?",
                    "What's the most ridiculous thing you've done for love?",
                    "What's a habit you have that others would find disgusting?",
                    "Have you ever ghosted someone? Why?",
                    "What's the most money you've ever spent on something stupid?",
                    "If you could change one thing about yourself, what would it be?",
                    "What's a talent you have that nobody knows about?",
                    "Who in this call do you think would survive a zombie apocalypse?",
                    "What's the last thing you Googled that you're embarrassed about?",
                    "What's your most controversial food opinion?",
                    "Have you ever cheated at a game? Which one?",
                    "What's the pettiest thing you've ever done?",
                    "If everyone could hear your thoughts for one hour, what would they learn?",
                    "What's the weirdest dream you've ever had?",
                    "Have you ever sent a text to the wrong person? What did it say?",
                    "What's a movie/show you pretend to have watched but haven't?",
                    "Who do you think is the worst dressed person you know? (Don't say their name!)",
                    "What's the most useless skill you have?",
                    "What's something you own way too many of?",
                ];
                const dares = [
                    "Speak in an accent for the next 2 minutes.",
                    "Do your best impression of someone in this call.",
                    "Tell us about your most embarrassing moment in as much detail as possible.",
                    "Send a GIF in the chat that describes your love life.",
                    "Make a sound like a farm animal until your next turn.",
                    "Try to lick your elbow. Right now. On camera.",
                    "Do your best robot dance for 10 seconds.",
                    "Read the last 5 emojis you sent and explain what you were doing.",
                    "Show the most recent photo in your camera roll.",
                    "Call someone you haven't talked to in months and say 'You've been on my mind.'",
                    "Do 15 push-ups on camera, no breaks.",
                    "Put an ice cube in your mouth and try to speak normally.",
                    "Eat a spoonful of the most random condiment in your kitchen.",
                    "Hold a straight face for 30 seconds while everyone else says funny things.",
                    "Let someone else post a status on your social media.",
                    "Talk in slow motion for the next round.",
                    "Spin around 10 times and then try to say your own name.",
                    "Text your last contact something completely random.",
                    "Do your best impression of a Shrek character.",
                    "Say the alphabet backwards in under 30 seconds.",
                    "Screen-share your browser history from today.",
                    "Go find your oldest piece of clothing and show the group.",
                    "Try to juggle with anything you can find near you.",
                    "Do a 30-second freestyle rap about this group call.",
                ];
                const type = Math.random() > 0.5 ? 'TRUTH' : 'DARE';
                const pool = type === 'TRUTH' ? truths : dares;
                const prompt = pool[Math.floor(Math.random() * pool.length)];
                gameData = { type, prompt };
            }
            // Track game data in memory for late joiners
            activeGameData.set(socket.roomId, { gameType: data.gameType, gameData });
            io.to(`room:${socket.roomId}`).emit('game-started', { gameType: data.gameType, gameData });
            callback({ success: true });
        });
        socket.on('end-game', async (callback) => {
            if (!socket.roomId) {
                callback({ success: false });
                return;
            }
            const room = await roomService.updateActiveGame(socket.roomId, 'NONE');
            if (!room) {
                callback({ success: false });
                return;
            }
            // Clear game data
            activeGameData.delete(socket.roomId);
            io.to(`room:${socket.roomId}`).emit('game-ended');
            callback({ success: true });
        });
        // Broadcast a player's quiz answer to all room members for sync
        socket.on('quiz-answer', (data) => {
            if (!socket.roomId || !socket.userId || !socket.user)
                return;
            io.to(`room:${socket.roomId}`).emit('quiz-answer-received', {
                userId: socket.userId,
                username: socket.user.username,
                avatarUrl: socket.user.avatarUrl,
                answerIndex: data.answerIndex,
            });
        });
        // --- DISCONNECT ---
        socket.on('disconnect', async () => {
            console.log(`[Socket] User disconnected: ${socket.id}`);
            if (socket.roomId && socket.userId) {
                const room = await roomService.removeUserFromRoom(socket.roomId, socket.userId);
                usersByRoom.get(socket.roomId)?.delete(socket.userId);
                if (room && socket.user) {
                    // Check if room is empty
                    if (!room.participants || room.participants.length === 0) {
                        console.log(`[Socket] Room ${socket.roomId} is empty on disconnect, deleting...`);
                        await roomService.deleteRoom(socket.roomId);
                        io.emit('room-deleted', { roomId: socket.roomId });
                    }
                    else {
                        io.to(`room:${socket.roomId}`).emit('user-left', {
                            userId: socket.userId,
                            username: socket.user.username,
                            onlineUsers: room.participants,
                        });
                    }
                }
            }
        });
        // --- MEDIA PERMISSIONS ---
        socket.on('request-media-permission', async (data) => {
            if (!socket.roomId || !socket.userId || !socket.user)
                return;
            const room = await roomService.getRoomById(socket.roomId);
            if (!room)
                return;
            if (room.hostId) {
                io.to(`user:${room.hostId}`).emit('media-permission-requested', {
                    userId: socket.userId,
                    username: socket.user.username,
                    type: data.type
                });
            }
        });
        socket.on('grant-media-permission', async (data) => {
            if (!socket.roomId || !socket.userId)
                return;
            const room = await roomService.getRoomById(socket.roomId);
            if (!room)
                return;
            if (room.hostId !== socket.userId)
                return;
            const permissions = {};
            if (data.type === 'audio')
                permissions.canSpeak = data.allowed;
            if (data.type === 'video')
                permissions.canVideo = data.allowed;
            await roomService.updateUserPermissions(socket.roomId, data.userId, permissions);
            io.to(`user:${data.userId}`).emit('media-permission-updated', {
                type: data.type,
                allowed: data.allowed
            });
            io.to(`room:${socket.roomId}`).emit('user-permissions-changed', {
                userId: data.userId,
                ...permissions
            });
        });
    });
}
//# sourceMappingURL=socketEvents.js.map