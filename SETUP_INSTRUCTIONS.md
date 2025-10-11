# Discord Ticket System Setup Instructions

Complete setup guide for the bidirectional Discord-Website ticket system.

## Prerequisites

1. Discord Bot with admin permissions
2. Discord Developer Portal access
3. Node.js application running

## Step 1: Discord Bot Setup

### 1.1 Enable Privileged Intents

Go to [Discord Developer Portal](https://discord.com/developers/applications) → Your Application → Bot:

Enable these Privileged Gateway Intents:
- ✅ **PRESENCE INTENT** (optional)
- ✅ **SERVER MEMBERS INTENT** (required)
- ✅ **MESSAGE CONTENT INTENT** (required)

### 1.2 Bot Permissions

Your bot needs these permissions (Permission Integer: 2416045072):
- ✅ View Channels
- ✅ Manage Channels
- ✅ Send Messages
- ✅ Manage Messages
- ✅ Embed Links
- ✅ Attach Files
- ✅ Read Message History
- ✅ Add Reactions
- ✅ Manage Roles (for permissions)

### 1.3 Invite Bot to Server

Use this URL format:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_CLIENT_ID&permissions=2416045072&scope=bot%20applications.commands
```

## Step 2: Discord Server Setup

### 2.1 Create Ticket Category

1. Create a new category in your Discord server
2. Name it "Tickets" or similar
3. Right-click the category → Copy ID (enable Developer Mode in Discord settings if needed)
4. Save this ID for configuration

### 2.2 Create/Get Staff Role

1. Create or identify your staff/support role
2. Right-click the role → Copy ID
3. Save this ID for configuration

## Step 3: Application Configuration

### 3.1 Environment Variables

Add these to your `.env` file:

```env
# Discord Bot Token (from Developer Portal → Bot → Token)
DISCORD_TOKEN=your_bot_token_here

# Main Bot Token (if using separate bot for announcements)
DISCORD_BOT_TOKEN=your_announcement_bot_token_here

# Your Discord Server ID
GUILD_ID=your_server_id_here

# Base URL of your website (for buttons)
BASE_URL=https://yourdomain.com/

# Optional: Ticket log channel (for notifications)
DISCORD_TICKET_LOG_CHANNEL=channel_id_here
```

### 3.2 Discord Configuration File

Update `config/discord.json`:

```json
{
  "ticketCategoryId": "1426107206251577397",
  "ticketAccessRoleId": "1284000550538448952"
}
```

Replace with your actual IDs from Step 2.

## Step 4: Database Update

If you have existing tickets, update them to add the `discordChannelId` field:

```javascript
// Run this once in MongoDB
db.tickets.updateMany(
  { discordChannelId: { $exists: false } },
  { $set: { discordChannelId: null } }
)
```

## Step 5: Restart Application

```bash
npm start
# or
pm2 restart your-app
```

## Step 6: Verify Setup

### Check Console Logs

You should see:
```
✅ Discord client logged in
✅ Discord client ready as YourBot#1234
✅ Discord ticket events loaded
✅ Announcement Bot Logged in as YourBot#1234
```

### Test Ticket Creation

1. Go to your website
2. Create a new ticket
3. Check Discord - a new channel should appear
4. The channel should have buttons: Claim, Close, Transcript, View on Web

### Test Message Sync

**Website → Discord:**
1. Send a message on the website ticket page
2. Check Discord channel - message should appear
3. Message should have a ✅ reaction

**Discord → Website:**
1. Send a message in the Discord ticket channel
2. Refresh the website ticket page
3. Message should appear on the website

### Test Buttons

**Claim Button:**
- Click "Claim"
- Should show who claimed the ticket

**Close Button:**
- Click "Close"
- Channel should rename to `closed-TKT-XXXXX`
- Reopen button should appear
- User should lose send message permission

**Reopen Button:**
- Click "Reopen"
- Channel should rename back to `ticket-TKT-XXXXX`
- Close button should appear
- User should regain send message permission

**Transcript Button:**
- Click "Transcript"
- Should download a text file with all messages

**View on Web Button:**
- Click "View on Web"
- Should open the ticket in admin panel

## Troubleshooting

### Bot Not Responding

**Check:**
- Bot is online in Discord
- Bot has correct permissions in the category
- Message Content Intent is enabled
- Environment variables are correct

**Fix:**
```bash
# Restart the application
pm2 restart your-app

# Check logs
pm2 logs your-app
```

### Channels Not Creating

**Check:**
- Category ID is correct in `config/discord.json`
- Bot has "Manage Channels" permission
- Category is not full (Discord limit: 50 channels per category)

**Fix:**
- Verify category ID
- Check bot role position (must be above created roles)
- Create a new category if full

### Messages Not Syncing

**Check:**
- Message Content Intent is enabled
- Bot has "Send Messages" permission
- `discordChannelId` is saved in ticket database

**Fix:**
```javascript
// Check ticket in database
const ticket = await Ticket.findOne({ ticketId: 'TKT-XXXXX' });
console.log(ticket.discordChannelId); // Should not be null

// If null, recreate channel
const DiscordTicketSync = require('./services/discordTicketSync');
const channelId = await DiscordTicketSync.createTicketChannel(ticket);
ticket.discordChannelId = channelId;
await ticket.save();
```

### Buttons Not Working

**Check:**
- User has the staff role
- Bot has "Manage Permissions" permission
- Ticket exists in database

**Fix:**
- Verify staff role ID in `config/discord.json`
- Check console for interaction errors
- Ensure user has staff role

### Duplicate Messages

**Check:**
- Only one instance of the bot is running
- `processedMessages` Set is working

**Fix:**
```bash
# Stop all instances
pm2 stop all

# Start one instance
pm2 start your-app
```

## Advanced Configuration

### Custom Button Emojis

Edit `services/discordTicketSync.js`:

```javascript
.setEmoji('🎫') // Custom emoji
.setEmoji('<:custom:123456789>') // Custom server emoji
```

### Automatic Transcript on Close

Edit `routes/admin/tickets.js` in the close route:

```javascript
// Before closing, generate transcript
const DiscordTicketSync = require('../../services/discordTicketSync');
// Generate transcript code here
```

### Custom Ticket Channel Names

Edit `services/discordTicketSync.js`:

```javascript
const channelName = `support-${ticket.ticketId.toLowerCase()}`;
// or
const channelName = `ticket-${ticket.username}-${Date.now()}`;
```

## Support

If you encounter issues:

1. Check console logs for errors
2. Verify all environment variables
3. Ensure bot has correct permissions
4. Test with a simple ticket first
5. Check Discord API status: https://discordstatus.com

## Security Notes

- Never commit `.env` file
- Keep bot token secret
- Regularly update dependencies
- Monitor bot for abuse
- Set up rate limiting if needed

## Performance Tips

- Clean up closed tickets after 7 days
- Archive old channels instead of deleting
- Use database indexes on `ticketId` and `discordChannelId`
- Monitor message sync performance
- Consider pagination for large ticket histories
