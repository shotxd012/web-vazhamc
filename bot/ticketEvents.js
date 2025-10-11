const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
const client = require('../config/discordClient');
const Ticket = require('../models/Ticket');
const Message = require('../models/TicketMessage');
const discordConfig = require('../config/discord.json');

// Map to track which messages we've already processed (prevent loops)
const processedMessages = new Set();

module.exports = (client) => {
    console.log('🎫 Initializing Discord ticket event listeners...');
    
    // Listen for messages in ticket channels
    client.on(Events.MessageCreate, async (message) => {
        try {
            // Ignore bot messages and messages we've already processed
            if (message.author.bot || processedMessages.has(message.id)) {
                return;
            }

            // Check if message is in a ticket channel
            if (!message.channel.name.startsWith('ticket-') && !message.channel.name.startsWith('closed-')) {
                return;
            }
            
            console.log(`📨 Message detected in ticket channel: ${message.channel.name}`);

            // Find the ticket by channel ID
            const ticket = await Ticket.findOne({ discordChannelId: message.channel.id });
            if (!ticket) {
                console.log('⚠️ Message in ticket channel but no ticket found:', message.channel.id);
                return;
            }

            // Mark message as processed
            processedMessages.add(message.id);

            // Get message content and attachments
            let content = message.content || null;
            let imageUrl = null;

            if (message.attachments.size > 0) {
                const attachment = message.attachments.first();
                if (attachment.contentType?.startsWith('image/')) {
                    imageUrl = attachment.url;
                }
            }

            // Skip if no content and no image
            if (!content && !imageUrl) return;

            // Check if user is staff (has the access role)
            const isStaff = message.member.roles.cache.has(discordConfig.ticketAccessRoleId);

            // Save message to database
            await Message.create({
                ticketId: ticket.ticketId,
                userId: message.author.id,
                username: message.author.username,
                avatar: message.author.avatar || 'default',
                message: content,
                image: imageUrl,
                role: isStaff ? 'Staff' : 'Member'
            });

            console.log(`✅ Synced message from Discord to web for ticket ${ticket.ticketId}`);

            // React to show message was synced
            await message.react('✅').catch(() => {});

            // Clean up old processed messages (keep last 100)
            if (processedMessages.size > 100) {
                const arr = Array.from(processedMessages);
                arr.slice(0, 50).forEach(id => processedMessages.delete(id));
            }
        } catch (error) {
            console.error('❌ Error syncing message from Discord:', error);
        }
    });

    // Listen for button interactions
    client.on(Events.InteractionCreate, async (interaction) => {
        try {
            if (!interaction.isButton()) return;

            const [action, ticketId] = interaction.customId.split('_');
            
            // Find the ticket
            const ticket = await Ticket.findOne({ ticketId });
            if (!ticket) {
                return await interaction.reply({ 
                    content: '❌ Ticket not found!', 
                    ephemeral: true 
                });
            }

            // Check if user has permission (must have access role)
            const hasPermission = interaction.member.roles.cache.has(discordConfig.ticketAccessRoleId);
            if (!hasPermission) {
                return await interaction.reply({ 
                    content: '❌ You do not have permission to perform this action!', 
                    ephemeral: true 
                });
            }

            switch (action) {
                case 'close':
                    if (ticket.status === 'closed') {
                        return await interaction.reply({ 
                            content: '⚠️ This ticket is already closed!', 
                            ephemeral: true 
                        });
                    }

                    ticket.status = 'closed';
                    ticket.closedReason = `Closed by ${interaction.user.username} via Discord`;
                    await ticket.save();

                    // Lock channel
                    await interaction.channel.permissionOverwrites.edit(ticket.userId, {
                        SendMessages: false
                    });
                    await interaction.channel.setName(`closed-${ticket.ticketId.toLowerCase()}`);

                    const closeEmbed = new EmbedBuilder()
                        .setTitle('🔒 Ticket Closed')
                        .setColor(0xff4c4c)
                        .setDescription(`**Closed by:** ${interaction.user.tag}\n**Reason:** Closed via Discord button`)
                        .setTimestamp();

                    await interaction.reply({ embeds: [closeEmbed] });
                    console.log(`✅ Ticket ${ticketId} closed from Discord`);
                    break;

                case 'reopen':
                    if (ticket.status !== 'closed') {
                        return await interaction.reply({ 
                            content: '⚠️ This ticket is not closed!', 
                            ephemeral: true 
                        });
                    }

                    ticket.status = 'open';
                    ticket.closedReason = null;
                    await ticket.save();

                    // Unlock channel
                    await interaction.channel.permissionOverwrites.edit(ticket.userId, {
                        SendMessages: true
                    });
                    await interaction.channel.setName(`ticket-${ticket.ticketId.toLowerCase()}`);

                    const reopenEmbed = new EmbedBuilder()
                        .setTitle('🔓 Ticket Reopened')
                        .setColor(0x00c48c)
                        .setDescription(`**Reopened by:** ${interaction.user.tag}`)
                        .setTimestamp();

                    await interaction.reply({ embeds: [reopenEmbed] });
                    console.log(`✅ Ticket ${ticketId} reopened from Discord`);
                    break;

                case 'claim':
                    const claimEmbed = new EmbedBuilder()
                        .setTitle('👋 Ticket Claimed')
                        .setColor(0xfbbf24)
                        .setDescription(`**Claimed by:** ${interaction.user.tag}\n\nThis staff member will assist you with your ticket.`)
                        .setTimestamp();

                    await interaction.reply({ embeds: [claimEmbed] });
                    console.log(`✅ Ticket ${ticketId} claimed by ${interaction.user.tag}`);
                    break;

                case 'delete':
                    await interaction.reply({ 
                        content: '⚠️ Please use the website to delete tickets. The channel will be deleted automatically.', 
                        ephemeral: true 
                    });
                    break;

                case 'view':
                    const webUrl = `${process.env.BASE_URL}admin/tickets/${ticketId}`;
                    await interaction.reply({ 
                        content: `🔗 View this ticket on the website: ${webUrl}`, 
                        ephemeral: true 
                    });
                    break;

                case 'transcript':
                    // Generate ticket transcript
                    try {
                        const Message = require('../models/TicketMessage');
                        const messages = await Message.find({ ticketId }).sort({ timestamp: 1 });
                        
                        let transcript = `═══════════════════════════════════════\n`;
                        transcript += `   TICKET TRANSCRIPT: ${ticketId}\n`;
                        transcript += `═══════════════════════════════════════\n\n`;
                        transcript += `Ticket: ${ticket.title}\n`;
                        transcript += `Reason: ${ticket.reason}\n`;
                        transcript += `Type: ${ticket.type}\n`;
                        transcript += `Status: ${ticket.status}\n`;
                        transcript += `Created: ${new Date(ticket.createdAt).toLocaleString()}\n\n`;
                        transcript += `═══════════════════════════════════════\n\n`;
                        
                        messages.forEach(msg => {
                            const timestamp = new Date(msg.timestamp).toLocaleString();
                            const role = msg.role ? `[${msg.role}]` : '';
                            transcript += `[${timestamp}] ${msg.username} ${role}:\n`;
                            if (msg.message) transcript += `${msg.message}\n`;
                            if (msg.image) transcript += `[Image: ${msg.image}]\n`;
                            transcript += `\n`;
                        });

                        transcript += `═══════════════════════════════════════\n`;
                        transcript += `End of transcript\n`;
                        
                        // Send as file
                        const buffer = Buffer.from(transcript, 'utf-8');
                        await interaction.reply({
                            content: '📄 Ticket transcript generated!',
                            files: [{
                                attachment: buffer,
                                name: `ticket-${ticketId}-transcript.txt`
                            }],
                            ephemeral: true
                        });
                    } catch (error) {
                        console.error('Error generating transcript:', error);
                        await interaction.reply({
                            content: '❌ Failed to generate transcript!',
                            ephemeral: true
                        });
                    }
                    break;

                default:
                    await interaction.reply({ 
                        content: '❌ Unknown action!', 
                        ephemeral: true 
                    });
            }
        } catch (error) {
            console.error('❌ Error handling button interaction:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: '❌ An error occurred while processing your request!', 
                    ephemeral: true 
                }).catch(() => {});
            }
        }
    });

    console.log('✅ Discord ticket events loaded successfully');
    console.log(`👂 Listening for messages in channels starting with: ticket- or closed-`);
};

// Export the processed messages set so the sync service can use it
module.exports.processedMessages = processedMessages;
