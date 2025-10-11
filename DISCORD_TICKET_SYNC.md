# Discord Ticket Sync

This feature automatically syncs all web ticket system actions with Discord channels.

## Configuration

Edit `config/discord.json` to configure:
- `ticketCategoryId`: Discord category where ticket channels will be created
- `ticketAccessRoleId`: Role that gets access to all ticket channels (staff/admin role)

## Features

### 1. **Ticket Creation**
When a ticket is created on the website:
- A new Discord channel is created in the configured category
- Channel name format: `ticket-TKT-XXXXXX`
- User who created the ticket gets access
- Staff role gets access with manage permissions
- Initial ticket information is posted as an embed

### 2. **Message Sync**
When messages are sent on the website:
- Messages from users appear in Discord with green embed
- Messages from staff appear in Discord with red embed and **[STAFF]** tag
- Images are included in the Discord embed

### 3. **Ticket Close**
When a ticket is closed:
- A "Ticket Closed" embed is sent to the channel
- User's send message permission is revoked
- Channel is renamed to `closed-TKT-XXXXXX`

### 4. **Ticket Reopen**
When a ticket is reopened:
- A "Ticket Reopened" embed is sent to the channel
- User's send message permission is restored
- Channel is renamed back to `ticket-TKT-XXXXXX`

### 5. **Ticket Delete**
When a ticket is deleted:
- The Discord channel is permanently deleted

## Bot Permissions Required

Make sure your Discord bot has these permissions:
- View Channels
- Manage Channels
- Send Messages
- Embed Links
- Attach Files
- Read Message History
- Manage Permissions

## Setup Instructions

1. Create a category in your Discord server for tickets
2. Get the category ID (Right click → Copy ID with Developer Mode enabled)
3. Get your staff role ID
4. Update `config/discord.json` with these IDs
5. Ensure your bot has the required permissions
6. Restart your application

## File Structure

```
config/
  └── discord.json              # Discord configuration
services/
  └── discordTicketSync.js      # Discord sync service
models/
  └── Ticket.js                 # Updated with discordChannelId field
routes/
  ├── tickets.js                # User ticket routes with sync
  ├── sourceCode.js             # Source code purchase tickets
  └── admin/
      └── tickets.js            # Admin ticket routes with sync
```

## Troubleshooting

If channels aren't being created:
1. Check bot permissions in the category
2. Verify the category ID in `config/discord.json`
3. Check console logs for error messages
4. Ensure the bot is in the correct server
5. Verify the bot has the required permissions

If messages aren't syncing:
1. Check that `discordChannelId` is being saved to the ticket
2. Verify the channel still exists in Discord
3. Check console logs for sync errors
