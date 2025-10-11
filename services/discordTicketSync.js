const { PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const client = require('../config/discordClient');
const discordConfig = require('../config/discord.json');

// Import processed messages tracker to prevent sync loops
let processedMessages;
try {
    processedMessages = require('../bot/ticketEvents').processedMessages;
} catch (err) {
    processedMessages = new Set();
}

class DiscordTicketSync {
    /**
     * Create a Discord channel for a ticket
     */
    static async createTicketChannel(ticket) {
        try {
            await client.waitUntilReady();

            const guild = client.guilds.cache.first();
            if (!guild) {
                console.error('❌ Bot is not in any guild');
                return null;
            }

            // Create channel
            const channelName = `ticket-${ticket.ticketId.toLowerCase()}`;
            const channel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: discordConfig.ticketCategoryId,
                topic: `${ticket.title} - ${ticket.username}`,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: ticket.userId,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.AttachFiles,
                            PermissionFlagsBits.EmbedLinks
                        ]
                    },
                    {
                        id: discordConfig.ticketAccessRoleId,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.AttachFiles,
                            PermissionFlagsBits.EmbedLinks,
                            PermissionFlagsBits.ManageMessages
                        ]
                    }
                ]
            });

            // Send initial embed with buttons
            const embed = new EmbedBuilder()
                .setTitle(`🎫 Ticket #${ticket.ticketId}`)
                .setColor(0x00c48c)
                .setDescription(`**Title:** ${ticket.title}\n**Reason:** ${ticket.reason}\n**Type:** ${ticket.type}\n\n**Description:**\n${ticket.description || 'No description provided'}`)
                .addFields(
                    { name: '👤 Created by', value: `<@${ticket.userId}>`, inline: true },
                    { name: '📅 Created at', value: new Date(ticket.createdAt).toLocaleString(), inline: true },
                    { name: '📊 Status', value: ticket.status.toUpperCase(), inline: true }
                )
                .setFooter({ text: `Ticket ID: ${ticket.ticketId}` })
                .setTimestamp();

            // Create action buttons
            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`claim_${ticket.ticketId}`)
                        .setLabel('Claim')
                        .setEmoji('👋')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`close_${ticket.ticketId}`)
                        .setLabel('Close')
                        .setEmoji('🔒')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(`transcript_${ticket.ticketId}`)
                        .setLabel('Transcript')
                        .setEmoji('📄')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`view_${ticket.ticketId}`)
                        .setLabel('View on Web')
                        .setEmoji('🌐')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`${process.env.BASE_URL}admin/tickets/${ticket.ticketId}`)
                );

            const message = await channel.send({
                content: `<@${ticket.userId}> <@&${discordConfig.ticketAccessRoleId}>`,
                embeds: [embed],
                components: [buttons]
            });

            // Pin the ticket message
            await message.pin().catch((err) => {
                console.log('⚠️ Could not pin message:', err.message);
            });

            console.log(`✅ Discord channel created: ${channel.id} (${channel.name}) for ticket ${ticket.ticketId}`);
            return channel.id;
        } catch (error) {
            console.error('❌ Error creating Discord ticket channel:', error);
            return null;
        }
    }

    /**
     * Send a message to Discord channel
     */
    static async sendMessage(ticket, message, isStaff = false) {
        try {
            if (!ticket.discordChannelId) {
                console.warn('⚠️ No Discord channel ID for ticket:', ticket.ticketId);
                return;
            }

            await client.waitUntilReady();

            const channel = await client.channels.fetch(ticket.discordChannelId).catch(() => null);
            if (!channel) {
                console.error('❌ Discord channel not found:', ticket.discordChannelId);
                return;
            }

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: message.username,
                    iconURL: `https://cdn.discordapp.com/avatars/${message.userId}/${message.avatar}.png`
                })
                .setColor(isStaff ? 0xff4c4c : 0x00c48c)
                .setTimestamp(message.timestamp);

            if (message.message) {
                embed.setDescription(message.message);
            }

            if (message.image) {
                embed.setImage(message.image);
            }

            const sentMessage = await channel.send({
                content: isStaff ? `**[STAFF]** <@${message.userId}>` : `<@${message.userId}>`,
                embeds: [embed]
            });

            // Mark this message as processed to prevent sync loop
            if (processedMessages) {
                processedMessages.add(sentMessage.id);
            }

            console.log(`✅ Message synced to Discord for ticket ${ticket.ticketId}`);
        } catch (error) {
            console.error('❌ Error sending message to Discord:', error);
        }
    }

    /**
     * Close/Archive ticket channel
     */
    static async closeTicketChannel(ticket) {
        try {
            if (!ticket.discordChannelId) {
                console.warn('⚠️ No Discord channel ID for ticket:', ticket.ticketId);
                return;
            }

            await client.waitUntilReady();

            const channel = await client.channels.fetch(ticket.discordChannelId).catch(() => null);
            if (!channel) {
                console.error('❌ Discord channel not found:', ticket.discordChannelId);
                return;
            }

            // Send close message with reopen button
            const embed = new EmbedBuilder()
                .setTitle('🔒 Ticket Closed')
                .setColor(0xff4c4c)
                .setDescription(`**Reason:** ${ticket.closedReason || 'No reason provided'}`)
                .setTimestamp();

            const reopenButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`reopen_${ticket.ticketId}`)
                        .setLabel('Reopen Ticket')
                        .setEmoji('🔓')
                        .setStyle(ButtonStyle.Success)
                );

            const sentMessage = await channel.send({ 
                embeds: [embed],
                components: [reopenButton]
            });

            // Pin the close message
            await sentMessage.pin().catch(() => {});

            // Mark as processed
            if (processedMessages) {
                processedMessages.add(sentMessage.id);
            }

            // Lock the channel (remove send permissions from user)
            await channel.permissionOverwrites.edit(ticket.userId, {
                SendMessages: false
            });

            // Rename channel to indicate it's closed
            await channel.setName(`closed-${ticket.ticketId.toLowerCase()}`);

            console.log(`✅ Discord channel closed for ticket ${ticket.ticketId}`);
        } catch (error) {
            console.error('❌ Error closing Discord channel:', error);
        }
    }

    /**
     * Reopen ticket channel
     */
    static async reopenTicketChannel(ticket) {
        try {
            if (!ticket.discordChannelId) {
                console.warn('⚠️ No Discord channel ID for ticket:', ticket.ticketId);
                return;
            }

            await client.waitUntilReady();

            const channel = await client.channels.fetch(ticket.discordChannelId).catch(() => null);
            if (!channel) {
                console.error('❌ Discord channel not found:', ticket.discordChannelId);
                return;
            }

            // Send reopen message with close button
            const embed = new EmbedBuilder()
                .setTitle('🔓 Ticket Reopened')
                .setColor(0x00c48c)
                .setTimestamp();

            const closeButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`close_${ticket.ticketId}`)
                        .setLabel('Close Ticket')
                        .setEmoji('🔒')
                        .setStyle(ButtonStyle.Danger)
                );

            const sentMessage = await channel.send({ 
                embeds: [embed],
                components: [closeButton]
            });

            // Mark as processed
            if (processedMessages) {
                processedMessages.add(sentMessage.id);
            }

            // Unlock the channel
            await channel.permissionOverwrites.edit(ticket.userId, {
                SendMessages: true
            });

            // Rename channel back
            await channel.setName(`ticket-${ticket.ticketId.toLowerCase()}`);

            console.log(`✅ Discord channel reopened for ticket ${ticket.ticketId}`);
        } catch (error) {
            console.error('❌ Error reopening Discord channel:', error);
        }
    }

    /**
     * Delete ticket channel
     */
    static async deleteTicketChannel(ticket) {
        try {
            if (!ticket.discordChannelId) {
                console.warn('⚠️ No Discord channel ID for ticket:', ticket.ticketId);
                return;
            }

            await client.waitUntilReady();

            const channel = await client.channels.fetch(ticket.discordChannelId).catch(() => null);
            if (!channel) {
                console.error('❌ Discord channel not found:', ticket.discordChannelId);
                return;
            }

            await channel.delete();
            console.log(`✅ Discord channel deleted for ticket ${ticket.ticketId}`);
        } catch (error) {
            console.error('❌ Error deleting Discord channel:', error);
        }
    }
}

module.exports = DiscordTicketSync;
