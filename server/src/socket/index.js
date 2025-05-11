// server/src/socket/index.js
import { verifyToken } from '../utils/jwtHelper.js'; // To authenticate socket connections
import prisma from '../config/db.js'; // To interact with the database

// In-memory store for active users in rooms (can be replaced with Redis for scalability)
// const activeRooms = new Map(); // Example: roomName -> Set of socketIds

const initializeSocketIO = (io) => {
  // Middleware for Socket.IO authentication (optional but recommended)
  // This runs for every new connection.
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (token) {
      try {
        const decoded = verifyToken(token); // Use your JWT verification utility
        if (decoded && decoded.userId) {
          // Fetch user details to ensure they are valid and active
          const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, name: true, role: true, status: true }
          });

          if (user && user.status === 'ACTIVE') {
            socket.user = user; // Attach user info to the socket object
            return next();
          } else {
            return next(new Error('Authentication error: User not found or inactive.'));
          }
        }
        return next(new Error('Authentication error: Invalid token payload.'));
      } catch (err) {
        console.error('Socket Auth Error:', err.message);
        return next(new Error('Authentication error: Token verification failed.'));
      }
    } else {
      // Allow unauthenticated connections if your app needs them for certain features,
      // otherwise, reject. For doubt chat, auth is likely required.
      // For now, let's assume most interactions require auth.
      // If some namespaces/events are public, handle auth more granularly.
      console.log(`Socket connection attempt without token from ${socket.id}`);
      return next(new Error('Authentication error: No token provided.'));
      // Or, if some parts are public: next(); and check socket.user in specific event handlers.
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id} (User ID: ${socket.user?.id}, Name: ${socket.user?.name})`);

    // --- Doubt Chat Room Logic ---
    socket.on('joinDoubtRoom', (doubtId) => {
      if (!doubtId || typeof doubtId !== 'string' && typeof doubtId !== 'number') {
        socket.emit('socketError', { message: 'Invalid doubtId provided for joining room.' });
        return;
      }
      const roomName = `doubt-${doubtId}`;
      socket.join(roomName);
      console.log(`User ${socket.user?.name} (${socket.id}) joined room: ${roomName}`);
      // Optionally, emit an event to the room that a user has joined
      // socket.to(roomName).emit('userJoinedDoubt', { userId: socket.user.id, userName: socket.user.name });
      socket.emit('joinedDoubtRoomSuccess', { doubtId, roomName });
    });

    socket.on('leaveDoubtRoom', (doubtId) => {
      if (!doubtId || typeof doubtId !== 'string' && typeof doubtId !== 'number') {
        socket.emit('socketError', { message: 'Invalid doubtId provided for leaving room.' });
        return;
      }
      const roomName = `doubt-${doubtId}`;
      socket.leave(roomName);
      console.log(`User ${socket.user?.name} (${socket.id}) left room: ${roomName}`);
      // Optionally, emit an event to the room that a user has left
      // socket.to(roomName).emit('userLeftDoubt', { userId: socket.user.id, userName: socket.user.name });
    });

    socket.on('sendDoubtMessage', async (data) => {
      // Data expected: { doubtId, content }
      // File handling would need a separate mechanism or pre-upload and sending URL in content
      if (!socket.user) {
        return socket.emit('socketError', { message: 'Authentication required to send messages.' });
      }
      if (!data || !data.doubtId || !data.content || typeof data.content !== 'string' || data.content.trim() === '') {
        return socket.emit('socketError', { message: 'Invalid message data. Doubt ID and content are required.' });
      }

      const numericDoubtId = parseInt(data.doubtId, 10);
      if (isNaN(numericDoubtId)) {
        return socket.emit('socketError', { message: 'Invalid Doubt ID format.' });
      }

      try {
        // 1. Verify doubt exists and user is allowed to post (e.g., asker or assigned instructor/admin)
        // This logic can be more complex and might involve a service call.
        const doubt = await prisma.doubt.findUnique({ where: { id: numericDoubtId } });
        if (!doubt) {
          return socket.emit('socketError', { message: `Doubt thread ${numericDoubtId} not found.` });
        }
        // Basic authorization check (can be expanded)
        const canPost = doubt.userId === socket.user.id ||
                        doubt.assignedInstructorId === socket.user.id ||
                        socket.user.role === 'ADMIN';

        if (!canPost) {
          return socket.emit('socketError', { message: 'You are not authorized to post in this doubt thread.' });
        }

        // 2. Save message to database
        const newMessage = await prisma.doubtMessage.create({
          data: {
            doubtId: numericDoubtId,
            userId: socket.user.id,
            content: data.content.trim(),
            // isBot: false, // Default
          },
          include: { // Include user details for broadcasting
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                profile: { select: { avatarUrl: true } },
              },
            },
          },
        });
        
        const formattedMessage = {
            ...newMessage,
            user: {
                id: newMessage.user.id,
                name: newMessage.user.name,
                role: newMessage.user.role,
                avatarUrl: newMessage.user.profile?.avatarUrl || null,
            }
        };


        // 3. Broadcast message to all clients in the room
        const roomName = `doubt-${numericDoubtId}`;
        io.to(roomName).emit('receiveDoubtMessage', formattedMessage);
        console.log(`Message sent by ${socket.user.name} to room ${roomName}: ${data.content.substring(0,30)}...`);

        // 4. Optionally, update doubt status if an instructor/admin posts
        if ((socket.user.role === 'INSTRUCTOR' && doubt.assignedInstructorId === socket.user.id) || socket.user.role === 'ADMIN') {
            if (doubt.status !== 'OPEN') {
                await prisma.doubt.update({
                    where: { id: numericDoubtId },
                    data: { status: 'OPEN', updatedAt: new Date() }
                });
                // Optionally emit a 'doubtStatusUpdated' event
                io.to(roomName).emit('doubtStatusUpdated', { doubtId: numericDoubtId, status: 'OPEN' });
            }
        }


      } catch (error) {
        console.error('Error processing sendDoubtMessage:', error);
        socket.emit('socketError', { message: 'Failed to send message. Please try again.' });
      }
    });

    // --- Typing Indicators (Example) ---
    socket.on('userTypingInDoubt', (data) => { // { doubtId, isTyping: boolean }
      if (socket.user && data.doubtId) {
        const roomName = `doubt-${data.doubtId}`;
        socket.to(roomName).emit('userTypingUpdate', {
          userId: socket.user.id,
          userName: socket.user.name,
          isTyping: data.isTyping,
        });
      }
    });


    // --- Handle Disconnect ---
    socket.on('disconnect', (reason) => {
      console.log(`🔌 User disconnected: ${socket.id} (User ID: ${socket.user?.id}, Name: ${socket.user?.name}). Reason: ${reason}`);
      // Clean up user from any rooms if tracking manually
      // Example:
      // activeRooms.forEach((usersInRoom, roomName) => {
      //   if (usersInRoom.has(socket.id)) {
      //     usersInRoom.delete(socket.id);
      //     socket.to(roomName).emit('userLeftDoubt', { userId: socket.user?.id, userName: socket.user?.name });
      //     if (usersInRoom.size === 0) {
      //       activeRooms.delete(roomName);
      //     }
      //   }
      // });
    });

    // Add more event handlers for other real-time features (live class interactions, notifications, etc.)
  });

  console.log('Socket.IO server initialized and listening for connections.');
};

export default initializeSocketIO;
