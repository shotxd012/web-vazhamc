# Discord Bidirectional Ticket Sync

Complete two-way synchronization between Discord and the web ticket system.

## Features

### 🔄 Bidirectional Message Sync

**Website → Discord:**
- Messages from users and staff sync to Discord in real-time
- User messages appear with green embed
- Staff messages appear with red embed and **[STAFF]** tag
- Images are included in embeds
- Messages get a ✅ reaction when synced

**Discord → Website:**
- Messages sent in Discord ticket channels automatically sync to the website
- Staff messages (users with access role) are marked as staff
- Regular user messages are marked as normal
- Images/attachments are synced
- Loop prevention ensures messages don't duplicate

### 🎮 Interactive Discord Buttons

**Ticket Creation:**
- ✅ **Claim Button**: Staff can claim tickets
- 🔒 **Close Button**: Close the ticket
- 🌐 **View on Web Button**: Direct link to admin panel

**Ticket Closed:**
- 🔓 **Reopen Button**: Reopen closed tickets

**Ticket Reopened:**
- 🔒 **Close Button**: Close the ticket again

### 🎯 Button Actions

All button actions are restricted to users with the access role:

1. **Claim Ticket**
   - Shows who is handling the ticket
   - Sends notification embed

2. **Close Ticket**
   - Locks the channel (user can't send messages)
   - Renames to `closed-TKT-XXXXX`
   - Updates database
   - Syncs to website

3. **Reopen Ticket**
   - Unlocks the channel
   - Renames to `ticket-TKT-XXXXX`
   - Updates database
   - Syncs to website

4. **View on Web**
   - Direct link to admin panel
   - Ephemeral message (only clicker sees it)

## Configuration

`config/discord.json`:
```json
{
  "ticketCategoryId": "1426107206251577397",
  "ticketAccessRoleId": "1284000550538448952"
}
```

## Message Flow

### From Website to Discord:
1. User/Staff sends message on website
2. Message saved to database
3. DiscordTicketSync sends embed to Discord channel
4. Message ID tracked to prevent loop

### From Discord to Website:
1. Staff/User sends message in Discord ticket channel
2. Bot detects message in ticket channel
3. Finds ticket by channel ID
4. Saves message to database
5. Reacts with ✅ to confirm sync
6. Message ID tracked to prevent loop

## Loop Prevention

The system uses a `processedMessages` Set to track Discord message IDs:
- When syncing website → Discord, the sent message ID is added to the set
- When receiving Discord messages, the set is checked first
- Old message IDs are cleaned up automatically (keeps last 100)

## Required Bot Permissions

- **View Channels**: Read ticket channels
- **Send Messages**: Send embeds and updates
- **Manage Channels**: Create, rename, and delete channels
- **Manage Permissions**: Set user access
- **Embed Links**: Send embeds
- **Attach Files**: Handle image attachments
- **Read Message History**: Access previous messages
- **Add Reactions**: React to synced messages
- **Manage Messages**: Pin important messages

## Discord Intents Required

Make sure these intents are enabled in Discord Developer Portal:

- ✅ GUILDS
- ✅ GUILD_MESSAGES
- ✅ MESSAGE_CONTENT (Privileged)
- ✅ GUILD_MEMBERS (Privileged)

## Setup

1. Enable required intents in Discord Developer Portal
2. Update `config/discord.json` with your IDs
3. Restart your application
4. Create a ticket to test the sync

## File Structure

```
bot/
  └── ticketEvents.js           # Discord event listeners
services/
  └── discordTicketSync.js      # Sync service with buttons
config/
  ├── discord.json              # Discord configuration
  ├── discordClient.js          # Discord client (updated)
  └── bot.js                    # Bot initialization (updated)
models/
  ├── Ticket.js                 # Ticket model
  └── TicketMessage.js          # Message model
```

## Event Listeners

### MessageCreate Event
Listens for messages in ticket channels and syncs them to the website.

### InteractionCreate Event
Handles button clicks for:
- Claiming tickets
- Closing tickets
- Reopening tickets
- Viewing on web

## Troubleshooting

### Messages not syncing from Discord to website:
1. Check that MESSAGE_CONTENT intent is enabled
2. Verify bot has access to the ticket channel
3. Check console for error messages
4. Ensure ticket has `discordChannelId` saved

### Buttons not working:
1. Verify user has the access role
2. Check bot permissions in the channel
3. Look for interaction errors in console
4. Ensure ticket exists in database

### Duplicate messages:
1. Loop prevention should handle this automatically
2. Check if `processedMessages` Set is working
3. Restart the bot if duplicates persist

## Testing

1. Create a ticket on the website
2. Check Discord channel is created with buttons
3. Send a message on the website → should appear in Discord
4. Send a message in Discord → should appear on website
5. Click "Close" button → ticket should close on both sides
6. Click "Reopen" button → ticket should reopen
7. Click "Claim" button → should show claim message

## Security

- Only users with the access role can use action buttons
- User message permissions are managed per ticket
- Staff can always access channels
- Ticket creator has specific permissions
