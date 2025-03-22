require('dotenv').config();
const mongoose = require('mongoose');
const ShotUser = require('./models/ShotUser');
const bcrypt = require('bcrypt');

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("✅ MongoDB Connected");
}).catch(err => console.error("❌ MongoDB Connection Error:", err));

async function addUser(username, password) {
    const hashedPassword = await bcrypt.hash(password, 10); // Hash password before saving

    try {
        const newUser = new ShotUser({ username, password: hashedPassword });
        await newUser.save();
        console.log(`✅ User ${username} added successfully!`);
    } catch (err) {
        console.error("❌ Error adding user:", err);
    } finally {
        mongoose.connection.close();
    }
}

// Change these values to add a user
addUser("shot", "1");
