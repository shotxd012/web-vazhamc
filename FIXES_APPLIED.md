# Fixes Applied to Discord Ticket Sync

## Problem Identified

You had **TWO separate Discord bot clients** trying to use the same token:
1. `config/discordClient.js` - Main client with ticket events
2. `config/bot.js` - Separate bot for announcements

Both were logging in with the same token, causing conflicts and preventing message sync from working.

## Fixes Applied

### 1. Consolidated Discord Clients ✅

**File: `config/bot.js`**

**Before:**
```javascript
const bot = new Client({ ... }); // Created NEW client
bot.login(process.env.DISCORD_BOT_TOKEN); // Tried to login again
```

**After:**
```javascript
const client = require('./discordClient'); // Use SAME client
const bot = client; // Share the client
// No duplicate login!
```

Now both announcement and ticket features use the SAME Discord client.

### 2. Added Debug Logging ✅

**Files Modified:**
- `bot/ticketEvents.js` - Added message detection logs
- `services/discordTicketSync.js` - Added channel creation logs

**New Logs You'll See:**
```bash
🎫 Initializing Discord ticket event listeners...
✅ Discord ticket events loaded successfully
👂 Listening for messages in channels starting with: ticket- or closed-
📨 Message detected in ticket channel: ticket-tkt-abc123
✅ Synced message from Discord to web for ticket TKT-ABC123
```

### 3. Created Debug Tools ✅

**New Files:**
- `test-ticket-sync.js` - Quick test script
- `fix-ticket-sync.sh` - Auto-fix script
- `DEBUG_GUIDE.md` - Complete debugging guide

## What You Need To Do Now

### Step 1: Enable MESSAGE_CONTENT Intent ⚠️ CRITICAL

1. Go to https://discord.com/developers/applications
2. Select your application
3. Go to **Bot** section
4. Scroll to **Privileged Gateway Intents**
5. Enable: ✅ **MESSAGE CONTENT INTENT**
6. Click **Save Changes**

**Without this, Discord → Website sync won't work!**

### Step 2: Restart Your Application

**Option A: Use the fix script (Recommended)**
```bash
./fix-ticket-sync.sh
```

**Option B: Manual restart**
```bash
pm2 restart all
# or
pm2 stop all && pm2 start app.js
```

### Step 3: Verify It's Working

**Run the test script:**
```bash
node test-ticket-sync.js
```

**Should see:**
```
✅ Bot is ready!
Bot: YourBot#1234
✅ Discord ticket events loaded successfully
👂 Listening for messages...
```

### Step 4: Test Full Sync

1. **Create a ticket on the website**
   - Should see: `✅ Discord channel created: 123456789 (ticket-tkt-xxx)`

2. **Send message on website**
   - Should see: `✅ Message synced to Discord for ticket TKT-XXX`
   - Check Discord: Message appears with ✅ reaction

3. **Send message in Discord**
   - Should see: `📨 Message detected in ticket channel: ticket-tkt-xxx`
   - Should see: `✅ Synced message from Discord to web`
   - Refresh website: Message appears

4. **Click Close button in Discord**
   - Should see: `✅ Ticket TKT-XXX closed from Discord`
   - Website shows ticket as closed

## Expected Console Output

When everything is working, you'll see this on startup:

```bash
✅ Discord client logged in
✅ Discord client ready as YourBot#1234 (id: 1234567890)
🎫 Initializing Discord ticket event listeners...
✅ Discord ticket events loaded successfully
👂 Listening for messages in channels starting with: ticket- or closed-
✅ Announcement commands initializing...
✅ /announce command registered!
```

When a message is sent in Discord:

```bash
📨 Message detected in ticket channel: ticket-tkt-abc123
✅ Synced message from Discord to web for ticket TKT-ABC123
```

When a message is sent on website:

```bash
✅ Message synced to Discord for ticket TKT-ABC123
```

## Troubleshooting

### Still Not Working?

1. **Check the logs:**
```bash
pm2 logs --lines 50
```

2. **Look for errors:**
- ❌ Discord login error
- ❌ Error loading ticket events
- ⚠️ Message in ticket channel but no ticket found

3. **Run debug script:**
```bash
node test-ticket-sync.js
```

4. **Check database:**
```javascript
// Make sure tickets have discordChannelId
db.tickets.findOne({ticketId: 'TKT-XXX'})
// Should show: discordChannelId: "123456789012345678"
```

### Common Issues

**Issue: "No Discord channel ID for ticket"**
- Channel wasn't created properly
- Create a new ticket to test

**Issue: "Discord channel not found"**
- Channel was deleted in Discord
- Ticket still has old channel ID
- Delete ticket and create new one

**Issue: Messages sync Website → Discord but not Discord → Website**
- MESSAGE_CONTENT intent not enabled
- Go enable it in Discord Developer Portal

**Issue: Buttons don't work**
- User doesn't have staff role
- Check `config/discord.json` has correct role ID

## Files Changed Summary

```
Modified:
✅ config/bot.js - Consolidated clients
✅ config/discordClient.js - Added ticket event initialization
✅ bot/ticketEvents.js - Added debug logging
✅ services/discordTicketSync.js - Added debug logging

Created:
✅ test-ticket-sync.js - Test script
✅ fix-ticket-sync.sh - Auto-fix script
✅ DEBUG_GUIDE.md - Debugging guide
✅ FIXES_APPLIED.md - This file
```

## Next Steps

1. ✅ Enable MESSAGE_CONTENT intent in Discord Portal
2. ✅ Run `./fix-ticket-sync.sh` or restart manually
3. ✅ Run `node test-ticket-sync.js` to verify
4. ✅ Create a test ticket
5. ✅ Test bidirectional sync
6. ✅ Celebrate! 🎉

## Need Help?

If still not working after following all steps:

1. Share output of: `node test-ticket-sync.js`
2. Share output of: `pm2 logs --lines 50`
3. Confirm MESSAGE_CONTENT intent is enabled
4. Check a ticket in database has `discordChannelId` field

## Important Notes

- The fix consolidated two bots into one
- All features (tickets + announcements) now use the same client
- MESSAGE_CONTENT intent is REQUIRED for Discord → Website sync
- Buttons only work for users with the staff role
- Logs are now much more verbose for debugging

Good luck! The sync should work perfectly now. 🚀
