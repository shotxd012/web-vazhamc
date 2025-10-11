# Discord Ticket Sync - Debug Guide

## Quick Test

Run this test script to check if everything is connected:

```bash
node test-ticket-sync.js
```

This will show:
- ✅ Bot connection status
- Guild information
- Ticket channels found
- Event listeners status

## Common Issues & Fixes

### 1. Channel Created But No Messages Sync

**Symptoms:**
- Discord channel is created
- Ticket appears on website
- Messages don't sync either way

**Check Console Logs:**
```bash
# Look for these logs when you start the app:
✅ Discord client logged in
✅ Discord client ready as YourBot#1234
🎫 Initializing Discord ticket event listeners...
✅ Discord ticket events loaded successfully
👂 Listening for messages in channels starting with: ticket- or closed-
```

**If you DON'T see the ticket events logs:**

The events aren't loading. Check:
1. `config/discordClient.js` has the ticket events initialization
2. Bot has MESSAGE_CONTENT intent enabled in Discord Developer Portal
3. No errors in the console

**Fix:**
```bash
# Restart the app completely
pm2 restart all
# or
npm start
```

### 2. Messages Only Sync One Way

**Website → Discord works but Discord → Website doesn't:**

Check:
1. MESSAGE_CONTENT intent enabled in Discord Developer Portal
2. Bot has permission to read messages in the category
3. Console shows `📨 Message detected in ticket channel: ticket-xxx` when you send a message in Discord

**If no message detected:**
- The event listener isn't working
- Check intents are enabled
- Verify bot is using the correct client

**Fix:**
```javascript
// In Discord Developer Portal → Bot → Privileged Gateway Intents
// Enable: MESSAGE CONTENT INTENT
```

### 3. Buttons Don't Work

**Check:**
1. User clicking has the staff role
2. Console shows button interaction logs
3. Bot has "Manage Permissions" permission

**Test:**
```javascript
// Check if user has role
const member = await guild.members.fetch('USER_ID');
console.log('Roles:', member.roles.cache.map(r => r.name));
```

### 4. Duplicate Bot Login Error

**Symptoms:**
```
Error: Used disallowed intents
```
or
```
Multiple clients with same token
```

**Fix:** We already fixed this! Make sure you have the updated `config/bot.js` that uses the shared client.

## Step-by-Step Debug Process

### Step 1: Check Bot Login

```bash
# Should see:
✅ Discord client logged in
✅ Discord client ready as YourBot#1234
✅ Announcement commands initializing...
```

### Step 2: Check Event Listeners

```bash
# Should see:
🎫 Initializing Discord ticket event listeners...
✅ Discord ticket events loaded successfully
👂 Listening for messages in channels starting with: ticket- or closed-
```

### Step 3: Create a Ticket

1. Create ticket on website
2. Check console:
```bash
✅ Discord channel created: 123456789 (ticket-tkt-abc123) for ticket TKT-ABC123
```

3. Check Discord - channel should exist with buttons

### Step 4: Test Website → Discord Sync

1. Send message on website
2. Check console:
```bash
✅ Message synced to Discord for ticket TKT-ABC123
```

3. Check Discord - message should appear with ✅ reaction

### Step 5: Test Discord → Website Sync

1. Send message in Discord ticket channel
2. Check console:
```bash
📨 Message detected in ticket channel: ticket-tkt-abc123
✅ Synced message from Discord to web for ticket TKT-ABC123
```

3. Refresh website - message should appear

### Step 6: Test Buttons

1. Click "Close" button in Discord
2. Check console:
```bash
✅ Ticket TKT-ABC123 closed from Discord
```

3. Check website - ticket should show as closed

## Manual Database Check

Check if channel ID is saved:

```javascript
// In MongoDB or via Node:
const Ticket = require('./models/Ticket');
const ticket = await Ticket.findOne({ ticketId: 'TKT-ABC123' });
console.log('Discord Channel ID:', ticket.discordChannelId);
// Should output: Discord Channel ID: 123456789012345678
```

If `discordChannelId` is `null` or `undefined`, the channel wasn't saved properly.

## Enable Debug Logging

Add this to your console to see ALL Discord events:

```javascript
// In config/discordClient.js, add after client creation:
client.on('debug', info => {
    console.log('🔍 DEBUG:', info);
});

client.on('warn', info => {
    console.log('⚠️ WARN:', info);
});

client.on('error', error => {
    console.error('❌ ERROR:', error);
});
```

## Check Discord Permissions

Run this in your app:

```javascript
const guild = client.guilds.cache.first();
const botMember = guild.members.cache.get(client.user.id);
const permissions = botMember.permissions.toArray();
console.log('Bot permissions:', permissions);

// Should include:
// - ViewChannel
// - SendMessages
// - ManageChannels
// - ManagePermissions
// - EmbedLinks
// - AttachFiles
// - ReadMessageHistory
// - AddReactions
```

## Force Re-sync Existing Ticket

If you have an existing ticket without Discord channel:

```javascript
const ticket = await Ticket.findOne({ ticketId: 'TKT-ABC123' });
const DiscordTicketSync = require('./services/discordTicketSync');

// Recreate channel
const channelId = await DiscordTicketSync.createTicketChannel(ticket);
ticket.discordChannelId = channelId;
await ticket.save();

console.log('Channel created:', channelId);
```

## Common Error Messages

### "No Discord channel ID for ticket"
**Cause:** Ticket doesn't have `discordChannelId` saved
**Fix:** Channel wasn't created or save failed. Create ticket again or manually sync.

### "Discord channel not found"
**Cause:** Channel was deleted manually in Discord
**Fix:** Set `discordChannelId` to null and recreate channel.

### "Message in ticket channel but no ticket found"
**Cause:** Channel exists but no ticket in database with that channel ID
**Fix:** Check database, or recreate ticket.

### "Error adding user to guild"
**Cause:** OAuth guilds.join issue (different problem)
**Fix:** Check user has authorized with guilds.join scope.

## Test Message Sync Manually

In Node console:

```javascript
// Test website → Discord
const ticket = await Ticket.findOne({ ticketId: 'TKT-ABC123' });
const Message = require('./models/TicketMessage');
const DiscordTicketSync = require('./services/discordTicketSync');

const testMessage = {
    ticketId: ticket.ticketId,
    userId: '123456789',
    username: 'TestUser',
    avatar: 'default',
    message: 'Test message from code',
    timestamp: new Date()
};

await DiscordTicketSync.sendMessage(ticket, testMessage, false);
// Check Discord - message should appear
```

## Still Not Working?

1. **Completely restart the application:**
```bash
pm2 delete all
pm2 start app.js
```

2. **Check Discord API Status:**
https://discordstatus.com

3. **Verify Bot Token:**
```bash
# In .env file, check:
DISCORD_TOKEN=your_token_here
# Should be the same bot for both
```

4. **Check Node.js Version:**
```bash
node --version
# Should be v16.9.0 or higher for discord.js v14
```

5. **Reinstall Dependencies:**
```bash
npm install discord.js@latest
```

## Get Help

If still not working, collect these logs and share:

```bash
# 1. Startup logs (first 50 lines)
pm2 logs --lines 50

# 2. Test script output
node test-ticket-sync.js

# 3. Check ticket in database
mongo
> use your_database
> db.tickets.findOne({ticketId: 'TKT-ABC123'})

# 4. Discord Developer Portal
# Screenshot of Bot → Privileged Gateway Intents
# Screenshot of Bot → Permissions
```
